// Orquestrador de varredura: roda todas as fontes ativas, deduplica,
// grava novos editais, busca detalhes e roda a análise de match.

import { all, one, run, getConfig } from "../db";
import { buscarProsas, detalheProsas } from "./prosas";
import { buscarRss } from "./rss";
import { analisarEdital, resolverModoIa } from "../analysis/analyzer";

export interface RelatorioVarredura {
  varreduraId: number;
  totalEncontrados: number;
  novos: number;
  analisados: number;
  analisadosIa: number;
  destaques: {
    id: number;
    nome: string;
    orgao: string | null;
    score: number | null;
    fimInscricoes: string | null;
    url: string | null;
  }[];
  erros: string[];
}

export async function executarVarredura(
  origem: "agendada" | "telegram" | "manual",
  opcoes?: { termo?: string; analisar?: boolean; completa?: boolean }
): Promise<RelatorioVarredura> {
  const erros: string[] = [];
  const varredura = await run(
    "INSERT INTO varreduras (origem) VALUES (?) RETURNING id",
    [origem]
  );
  const varreduraId = Number((varredura[0] as { id: number }).id);

  const keywords: string[] = opcoes?.termo
    ? [opcoes.termo]
    : JSON.parse((await getConfig("keywords_busca")) ?? "[]");

  type Normalizado = {
    fonte: string;
    fonteId: string;
    nome: string;
    orgao: string | null;
    url: string | null;
    descricao: string | null;
    inicioInscricoes: string | null;
    fimInscricoes: string | null;
    areas: string[];
  };

  const encontrados = new Map<string, Normalizado>();

  const registraProsas = (
    res: Awaited<ReturnType<typeof buscarProsas>>
  ) => {
    for (const e of res) {
      encontrados.set(`prosas:${e.fonteId}`, {
        fonte: "prosas",
        fonteId: e.fonteId,
        nome: e.nome,
        orgao: e.orgao,
        url: e.url,
        descricao: null,
        inicioInscricoes: e.inicioInscricoes,
        fimInscricoes: e.fimInscricoes,
        areas: e.areas,
      });
    }
  };

  if (opcoes?.completa) {
    // --- Varredura COMPLETA: todo o catálogo de inscrições abertas da
    // Central de Editais da Prosas, sem filtro de keyword (pagina até o fim).
    try {
      registraProsas(await buscarProsas(undefined, 12));
    } catch (err) {
      erros.push(`Prosas(completa): ${err instanceof Error ? err.message : err}`);
    }
  } else {
    // --- Prosas: uma busca por keyword (API pública da Central de Editais)
    for (const termo of keywords) {
      try {
        registraProsas(await buscarProsas(termo, 2));
      } catch (err) {
        erros.push(`Prosas("${termo}"): ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // --- Feeds RSS cadastrados
  const feeds = await all<{ nome: string; url: string }>(
    "SELECT nome, url FROM fontes_rss WHERE ativa = 1"
  );
  for (const feed of feeds) {
    try {
      const res = await buscarRss(feed.url);
      for (const e of res) {
        encontrados.set(`rss:${e.fonteId}`, {
          fonte: "rss",
          fonteId: e.fonteId,
          nome: e.nome,
          orgao: feed.nome,
          url: e.url,
          descricao: e.descricao,
          inicioInscricoes: e.publicadoEm,
          fimInscricoes: null,
          areas: [],
        });
      }
    } catch (err) {
      erros.push(`RSS(${feed.nome}): ${err instanceof Error ? err.message : err}`);
    }
  }

  // --- gravação com dedup (UNIQUE fonte+fonte_id)
  const novosIds: number[] = [];
  for (const e of encontrados.values()) {
    const r = await run(
      `INSERT INTO editais
        (fonte, fonte_id, nome, orgao, url, descricao, inicio_inscricoes, fim_inscricoes, areas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (fonte, fonte_id) DO NOTHING RETURNING id`,
      [
        e.fonte,
        e.fonteId,
        e.nome,
        e.orgao,
        e.url,
        e.descricao,
        e.inicioInscricoes,
        e.fimInscricoes,
        JSON.stringify(e.areas),
      ]
    );
    if (r.length > 0) novosIds.push(Number((r[0] as { id: number }).id));
  }

  // --- detalhes da Prosas para os novos (descrição e valores)
  for (const id of novosIds) {
    const row = await one<{ fonte: string; fonte_id: string }>(
      "SELECT fonte, fonte_id FROM editais WHERE id = ?",
      [id]
    );
    if (row?.fonte === "prosas") {
      const det = await detalheProsas(row.fonte_id);
      if (det) {
        await run(
          "UPDATE editais SET descricao = ?, valor_total = ?, moeda = ? WHERE id = ?",
          [det.descricao ?? null, det.valorTotal ?? null, det.moeda ?? null, id]
        );
      }
    }
  }

  // --- análise dos novos em 2 fases:
  // 1) triagem heurística (rápida e grátis) em TODOS os novos;
  // 2) análise profunda com IA (assinatura/API) só nos mais promissores,
  //    limitada por config ia_max_por_varredura para preservar o crédito.
  let analisados = 0;
  let analisadosIa = 0;
  if (opcoes?.analisar !== false) {
    for (const id of novosIds) {
      try {
        await analisarEdital(id, { forcarModo: "heuristica" });
        analisados++;
      } catch (err) {
        erros.push(`Análise #${id}: ${err instanceof Error ? err.message : err}`);
      }
    }

    const modo = await resolverModoIa();
    if (modo !== "heuristica" && novosIds.length > 0) {
      const maxIa = parseInt((await getConfig("ia_max_por_varredura")) ?? "10", 10);
      const candidatos = await all<{ id: number }>(
        `SELECT id FROM editais
         WHERE id IN (${novosIds.map(() => "?").join(",")})
           AND score >= 35 AND status != 'descartado'
         ORDER BY score DESC LIMIT ?`,
        [...novosIds, maxIa]
      );
      for (const c of candidatos) {
        try {
          await analisarEdital(c.id, { forcarModo: modo });
          analisadosIa++;
        } catch (err) {
          erros.push(`IA #${c.id}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  const destaques =
    novosIds.length > 0
      ? ((await all(
          `SELECT id, nome, orgao, score, fim_inscricoes as "fimInscricoes", url
           FROM editais WHERE id IN (${novosIds.map(() => "?").join(",")})
           ORDER BY score DESC NULLS LAST LIMIT 10`,
          novosIds
        )) as RelatorioVarredura["destaques"])
      : [];

  await run(
    `UPDATE varreduras SET finalizada_em = now(),
     total_encontrados = ?, novos = ?, detalhe = ? WHERE id = ?`,
    [encontrados.size, novosIds.length, JSON.stringify({ erros, keywords }), varreduraId]
  );

  return {
    varreduraId,
    totalEncontrados: encontrados.size,
    novos: novosIds.length,
    analisados,
    analisadosIa,
    destaques,
    erros,
  };
}
