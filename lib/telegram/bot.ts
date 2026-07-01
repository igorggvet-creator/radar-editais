// Bot do Telegram (grammY, long polling).
// - Busca sob demanda: /buscar [termo]
// - Alertas da varredura semanal para todos os chats registrados
// Sem TELEGRAM_BOT_TOKEN o módulo é inerte (o dashboard segue funcionando).

import { Bot } from "grammy";
import { all, one, getConfig, setConfig, EditalRow } from "../db";
import { executarVarredura } from "../sources";
import { modoIaInfo } from "../analysis/analyzer";

let bot: Bot | null = null;
let iniciado = false;

async function chatsRegistrados(): Promise<number[]> {
  return JSON.parse((await getConfig("telegram_chats")) ?? "[]");
}

async function registrarChat(chatId: number) {
  const chats = new Set(await chatsRegistrados());
  if (!chats.has(chatId)) {
    chats.add(chatId);
    await setConfig("telegram_chats", JSON.stringify([...chats]));
  }
}

function fmtData(iso: string | null): string {
  if (!iso) return "sem data";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtEdital(e: {
  id: number;
  nome: string;
  orgao: string | null;
  score: number | null;
  fimInscricoes?: string | null;
  fim_inscricoes?: string | null;
  url: string | null;
}): string {
  const fim = e.fimInscricoes ?? e.fim_inscricoes ?? null;
  const score = e.score !== null ? `⭐ ${e.score}` : "—";
  return `<b>#${e.id}</b> ${escapeHtml(e.nome)}\n${e.orgao ? `🏛 ${escapeHtml(e.orgao)} · ` : ""}${score} · 📅 até ${fmtData(fim)}${e.url ? `\n🔗 ${e.url}` : ""}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getBot(): Bot | null {
  return bot;
}

// Constrói o bot com todos os handlers registrados (SEM iniciar polling).
// Usado tanto pelo polling local quanto pelo webhook na Vercel.
export function construirBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    await registrarChat(ctx.chat.id);
    await ctx.reply(
      `🎮 <b>Radar de Editais — GameJam+ &amp; Indie Hero</b>\n\nEste chat está registrado para receber os alertas da varredura semanal.\n\nComandos:\n/buscar [termo] — varredura sob demanda\n/editais — melhores editais no pipeline\n/edital N — detalhe do edital #N\n/status — situação do radar\n/ajuda — esta mensagem`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("ajuda", async (ctx) => {
    const ia = await modoIaInfo();
    await ctx.reply(
      `Comandos:\n/buscar [termo] — varredura sob demanda nas fontes (Prosas + RSS)\n/editais — top 10 editais por score\n/edital N — detalhe e análise do edital #N\n/status — números do radar e última varredura\n\nModo de análise atual: ${ia.resolvido === "heuristica" ? "📐" : "🧠"} ${ia.rotulo}`
    );
  });

  bot.command("buscar", async (ctx) => {
    await registrarChat(ctx.chat.id);
    const termo = ctx.match?.trim() || undefined;
    await ctx.reply(
      `🔍 Varrendo fontes${termo ? ` por "${termo}"` : " com as keywords padrão"}... isso pode levar um minuto.`
    );
    try {
      const rel = await executarVarredura("telegram", { termo });
      const linhas = [
        `✅ Varredura concluída!`,
        `Encontrados: ${rel.totalEncontrados} · Novos: ${rel.novos} · Analisados: ${rel.analisados}${rel.analisadosIa ? ` (🧠 ${rel.analisadosIa} com IA)` : ""}`,
      ];
      if (rel.destaques.length > 0) {
        linhas.push("", "<b>Destaques:</b>");
        for (const d of rel.destaques.slice(0, 5)) linhas.push("", fmtEdital(d));
      } else if (rel.novos === 0) {
        linhas.push("Nenhum edital novo — tudo que foi encontrado já estava no radar.");
      }
      if (rel.erros.length) linhas.push("", `⚠️ Erros: ${rel.erros.join("; ").slice(0, 300)}`);
      await ctx.reply(linhas.join("\n"), { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    } catch (err) {
      await ctx.reply(`❌ Erro na varredura: ${err instanceof Error ? err.message : err}`);
    }
  });

  bot.command("editais", async (ctx) => {
    await registrarChat(ctx.chat.id);
    const rows = await all<EditalRow>(
      `SELECT id, nome, orgao, score, fim_inscricoes, url FROM editais
       WHERE status NOT IN ('descartado','submetido')
       ORDER BY score DESC NULLS LAST, fim_inscricoes ASC LIMIT 10`
    );
    if (rows.length === 0) {
      await ctx.reply("Pipeline vazio. Use /buscar para varrer as fontes.");
      return;
    }
    await ctx.reply(
      `📋 <b>Top ${rows.length} editais no pipeline</b>\n\n` +
        rows.map((e) => fmtEdital(e)).join("\n\n"),
      { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
    );
  });

  bot.command("edital", async (ctx) => {
    const id = parseInt(ctx.match?.trim() ?? "", 10);
    if (isNaN(id)) {
      await ctx.reply("Use: /edital N (ex.: /edital 12)");
      return;
    }
    const e = await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [id]);
    if (!e) {
      await ctx.reply(`Edital #${id} não encontrado.`);
      return;
    }
    const eleg = e.elegibilidade
      ? (JSON.parse(e.elegibilidade) as Record<string, { ok: boolean; nota: string }>)
      : null;
    const linhas = [
      fmtEdital(e),
      "",
      `Status: <b>${e.status}</b> · Pilar: ${e.pilar_slug ?? "—"} · Executora: ${e.empresa_slug ?? "—"}`,
    ];
    if (e.analise_resumo) linhas.push("", `🧾 ${escapeHtml(e.analise_resumo)}`);
    if (eleg) {
      linhas.push("", "<b>Elegibilidade:</b>");
      for (const [k, v] of Object.entries(eleg)) {
        linhas.push(`${v.ok ? "✅" : "❌"} ${k}: ${escapeHtml(v.nota)}`);
      }
    }
    await ctx.reply(linhas.join("\n"), { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
  });

  bot.command("status", async (ctx) => {
    const porStatus = await all<{ status: string; c: number }>(
      "SELECT status, COUNT(*)::int c FROM editais GROUP BY status"
    );
    const ultima = await one<{ iniciada_em: string; origem: string; novos: number }>(
      "SELECT * FROM varreduras ORDER BY id DESC LIMIT 1"
    );
    const ia = await modoIaInfo();
    const linhas = [
      "📊 <b>Status do Radar</b>",
      "",
      ...porStatus.map((s) => `${s.status}: ${s.c}`),
      "",
      ultima
        ? `Última varredura: ${fmtData(String(ultima.iniciada_em))} (${ultima.origem}) — ${ultima.novos} novos`
        : "Nenhuma varredura executada ainda.",
      `Análise: ${ia.resolvido === "heuristica" ? "📐" : "🧠"} ${ia.rotulo}`,
      `Agenda semanal: ${(await getConfig("cron_semanal")) ?? "—"} (cron)`,
    ];
    await ctx.reply(linhas.join("\n"), { parse_mode: "HTML" });
  });

  bot.catch((err) => console.error("[telegram] erro:", err));
  return bot;
}

// Inicia o polling (apenas em ambiente local/persistente — NÃO na Vercel).
export async function iniciarBot() {
  if (iniciado) return;
  const b = construirBot();
  if (!b) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN ausente — bot desativado.");
    return;
  }
  iniciado = true;
  bot = b;
  bot.start({
    onStart: (me) => console.log(`[telegram] bot @${me.username} online (polling)`),
  });
}

export async function notificarVarreduraSemanal(rel: {
  novos: number;
  totalEncontrados: number;
  destaques: { id: number; nome: string; orgao: string | null; score: number | null; fimInscricoes: string | null; url: string | null }[];
}) {
  const b = bot ?? construirBot();
  if (!b) return;
  const chats = await chatsRegistrados();
  if (chats.length === 0) return;
  const linhas = [
    "📬 <b>Varredura semanal do Radar de Editais</b>",
    `Encontrados: ${rel.totalEncontrados} · Novos no radar: ${rel.novos}`,
  ];
  if (rel.destaques.length) {
    linhas.push("", "<b>Destaques da semana:</b>");
    for (const d of rel.destaques.slice(0, 5)) linhas.push("", fmtEdital(d));
  } else {
    linhas.push("", "Semana sem editais novos com match. 🌵");
  }
  for (const chatId of chats) {
    try {
      await b.api.sendMessage(chatId, linhas.join("\n"), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    } catch (err) {
      console.error(`[telegram] falha ao notificar chat ${chatId}:`, err);
    }
  }
}
