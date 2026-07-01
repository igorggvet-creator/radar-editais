// Geração de proposta ASSÍNCRONA: cria a proposta em estado "gerando" e
// responde na hora com o id; a redação (lenta) roda em background e a página
// /propostas/[id] acompanha ao vivo. Evita timeout de request e funciona mesmo
// quando o claude -p leva minutos.

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { criarPropostaPendente, processarProposta } from "@/lib/proposals/generator";

export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id: propostaId } = await criarPropostaPendente(parseInt(id, 10));
    // processa após a resposta. after() mantém a função viva na Vercel
    // (dentro do limite de maxDuration); local roda igual.
    after(async () => {
      try {
        await processarProposta(propostaId);
      } catch (e) {
        console.error("[proposta route] processamento falhou:", e);
      }
    });
    return NextResponse.json({ id: propostaId, status: "gerando" });
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
