import { NextRequest, NextResponse } from "next/server";
import { one } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposta = await one("SELECT * FROM propostas WHERE id = ?", [id]);
  if (!proposta) {
    return NextResponse.json({ erro: "não encontrada" }, { status: 404 });
  }
  return NextResponse.json(proposta);
}
