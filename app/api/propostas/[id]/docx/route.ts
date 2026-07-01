import { NextRequest, NextResponse } from "next/server";
import { one } from "@/lib/db";
import { propostaParaDocx } from "@/lib/proposals/docx";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposta = await one<{ titulo: string; conteudo: string }>(
    "SELECT * FROM propostas WHERE id = ?",
    [id]
  );
  if (!proposta) {
    return NextResponse.json({ erro: "não encontrada" }, { status: 404 });
  }
  const buffer = await propostaParaDocx(proposta.conteudo);
  const nomeArquivo = (proposta.titulo ?? "proposta")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .slice(0, 80)
    .trim()
    .replace(/\s+/g, "_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo || "proposta"}.docx"`,
    },
  });
}
