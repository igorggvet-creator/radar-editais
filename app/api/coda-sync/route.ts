import { NextResponse } from "next/server";
import { importarCoda } from "@/lib/coda/import";

export async function POST() {
  try {
    const r = await importarCoda();
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
