import { NextRequest, NextResponse } from "next/server";
import { all } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let sqlText = "SELECT * FROM editais WHERE 1=1";
  const params: unknown[] = [];
  if (status) {
    sqlText += " AND status = ?";
    params.push(status);
  }
  if (q) {
    sqlText += " AND (nome ILIKE ? OR orgao ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sqlText += " ORDER BY score DESC NULLS LAST, fim_inscricoes ASC LIMIT 200";

  return NextResponse.json(await all(sqlText, params));
}
