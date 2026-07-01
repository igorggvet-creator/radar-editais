import { NextRequest, NextResponse } from "next/server";
import { executarVarredura } from "@/lib/sources";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const rel = await executarVarredura("manual", {
      termo: body.termo || undefined,
      completa: body.completa === true,
    });
    return NextResponse.json(rel);
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
