// Reanálise em lote do pipeline com IA.
// POST inicia (resposta instantânea, processa em background);
// GET retorna o progresso ao vivo; DELETE cancela.

import { NextRequest, NextResponse } from "next/server";
import {
  iniciarReanalisePipeline,
  statusReanalise,
  cancelarReanalise,
} from "@/lib/analysis/batch";

export async function GET() {
  return NextResponse.json(await statusReanalise());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const r = await iniciarReanalisePipeline({
    incluirFechados: body.incluirFechados === true,
  });
  if (!r.iniciado) {
    return NextResponse.json({ erro: r.motivo }, { status: 409 });
  }
  return NextResponse.json({
    iniciado: true,
    total: r.total,
    status: await statusReanalise(),
  });
}

export async function DELETE() {
  cancelarReanalise();
  return NextResponse.json({ cancelado: true });
}
