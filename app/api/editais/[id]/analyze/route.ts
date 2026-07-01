import { NextRequest, NextResponse } from "next/server";
import { analisarEdital } from "@/lib/analysis/analyzer";

export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const edital = await analisarEdital(parseInt(id, 10));
    return NextResponse.json(edital);
  } catch (err) {
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
