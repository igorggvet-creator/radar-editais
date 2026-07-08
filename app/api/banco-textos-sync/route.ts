import { NextResponse } from "next/server";
import { importarProjetos } from "@/lib/banco-textos-projetos/import";

export const maxDuration = 60;

export async function POST() {
  try {
    const r = await importarProjetos();
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
