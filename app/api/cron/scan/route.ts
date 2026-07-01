// Endpoint disparado pelo Vercel Cron (config em vercel.json) toda segunda.
// Faz a varredura semanal + alerta no Telegram. Protegido por CRON_SECRET
// (a Vercel envia o header Authorization: Bearer $CRON_SECRET).

import { NextRequest, NextResponse } from "next/server";
import { executarVarredura } from "@/lib/sources";
import { notificarVarreduraSemanal } from "@/lib/telegram/bot";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  }

  try {
    const rel = await executarVarredura("agendada");
    await notificarVarreduraSemanal(rel);
    return NextResponse.json({
      ok: true,
      novos: rel.novos,
      total: rel.totalEncontrados,
      analisadosIa: rel.analisadosIa,
    });
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
