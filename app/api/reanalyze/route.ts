// Reanálise em lote com IA: pega os editais mais promissores do pipeline
// (já triados pela heurística) e refaz a análise com Claude
// (assinatura ou API, conforme o modo resolvido).

import { NextRequest, NextResponse } from "next/server";
import { all } from "@/lib/db";
import { analisarEdital, resolverModoIa } from "@/lib/analysis/analyzer";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const limite = Math.max(1, Math.min(25, parseInt(String(body.limite ?? 10), 10) || 10));

  const modo = await resolverModoIa();
  if (modo === "heuristica") {
    return NextResponse.json(
      { erro: "Nenhum modo de IA disponível (CLI não logado e sem ANTHROPIC_API_KEY)." },
      { status: 400 }
    );
  }

  // prioriza quem ainda não passou por IA, com melhor score e prazo aberto
  const alvos = await all<{ id: number; nome: string }>(
    `SELECT id, nome FROM editais
     WHERE status NOT IN ('descartado','submetido')
       AND (analise_modo IS NULL OR analise_modo = 'heuristica')
       AND (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)
     ORDER BY score DESC NULLS LAST
     LIMIT ?`,
    [limite]
  );

  const resultados: { id: number; nome: string; score: number | null; status: string; ok: boolean }[] = [];
  for (const alvo of alvos) {
    try {
      const e = await analisarEdital(alvo.id, { forcarModo: modo });
      resultados.push({ id: e.id, nome: e.nome, score: e.score, status: e.status, ok: true });
    } catch {
      resultados.push({ id: alvo.id, nome: alvo.nome, score: null, status: "erro", ok: false });
    }
  }

  return NextResponse.json({
    modo,
    processados: resultados.length,
    resultados,
  });
}
