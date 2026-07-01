import { NextRequest, NextResponse } from "next/server";
import { all, run, getConfig, setConfig } from "@/lib/db";
import { agendarVarreduraSemanal } from "@/lib/scheduler";
import { modoIaInfo } from "@/lib/analysis/analyzer";

export async function GET() {
  const fontes = await all("SELECT * FROM fontes_rss ORDER BY id");
  const ia = await modoIaInfo();
  return NextResponse.json({
    keywords: JSON.parse((await getConfig("keywords_busca")) ?? "[]"),
    cronSemanal: await getConfig("cron_semanal"),
    prazoMinimoDias: parseInt((await getConfig("prazo_minimo_dias")) ?? "10", 10),
    fontesRss: fontes,
    telegramAtivo: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    telegramChats: JSON.parse((await getConfig("telegram_chats")) ?? "[]").length,
    // IA
    claudeAtivo: ia.resolvido !== "heuristica",
    modoIa: ia.configurado,
    modoIaResolvido: ia.resolvido,
    modoIaRotulo: ia.rotulo,
    cliDisponivel: ia.cliDisponivel,
    cliVersao: ia.cliVersao,
    apiDisponivel: ia.apiDisponivel,
    iaMaxPorVarredura: parseInt((await getConfig("ia_max_por_varredura")) ?? "10", 10),
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body.keywords)) {
    await setConfig("keywords_busca", JSON.stringify(body.keywords));
  }
  if (typeof body.cronSemanal === "string") {
    await setConfig("cron_semanal", body.cronSemanal);
    await agendarVarreduraSemanal();
  }
  if (
    typeof body.modoIa === "string" &&
    ["auto", "assinatura", "api", "heuristica"].includes(body.modoIa)
  ) {
    await setConfig("modo_ia", body.modoIa);
  }
  if (body.iaMaxPorVarredura !== undefined) {
    const n = Math.max(0, Math.min(100, parseInt(String(body.iaMaxPorVarredura), 10) || 0));
    await setConfig("ia_max_por_varredura", String(n));
  }
  if (Array.isArray(body.fontesRss)) {
    await run("DELETE FROM fontes_rss");
    for (const f of body.fontesRss) {
      if (f.url) {
        await run(
          "INSERT INTO fontes_rss (nome, url, ativa) VALUES (?, ?, ?) ON CONFLICT (url) DO NOTHING",
          [f.nome ?? f.url, f.url, f.ativa === false ? 0 : 1]
        );
      }
    }
  }
  return GET();
}
