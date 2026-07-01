import { NextRequest, NextResponse } from "next/server";
import { all, one, run } from "@/lib/db";

const STATUS_VALIDOS = [
  "radar",
  "triagem",
  "match",
  "escrita",
  "submetido",
  "descartado",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const edital = await one("SELECT * FROM editais WHERE id = ?", [id]);
  if (!edital) {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }
  const propostas = await all(
    "SELECT id, titulo, modo, criado_em FROM propostas WHERE edital_id = ? ORDER BY id DESC",
    [id]
  );
  return NextResponse.json({ ...edital, propostas });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.status) {
    if (!STATUS_VALIDOS.includes(body.status)) {
      return NextResponse.json({ erro: "status inválido" }, { status: 400 });
    }
    await run(
      "UPDATE editais SET status = ?, motivo_descarte = ?, atualizado_em = now() WHERE id = ?",
      [body.status, body.motivoDescarte ?? null, id]
    );
  }

  return NextResponse.json(await one("SELECT * FROM editais WHERE id = ?", [id]));
}
