import Link from "next/link";
import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { fmtData } from "@/components/ui";

export const dynamic = "force-dynamic";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mdInline = (s: string) =>
  s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const ehLinhaTabela = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const ehSeparadorTabela = (l: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes("-");
function celulas(line: string): string[] {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split("|").map((c) => c.trim());
}

function mdParaHtml(md: string): string {
  // markdown → HTML com suporte a tabelas, títulos, negrito, listas e citações
  const lines = escHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${para.join("<br/>")}</p>`);
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // tabela
    if (ehLinhaTabela(line) && i + 1 < lines.length && ehSeparadorTabela(lines[i + 1])) {
      flush();
      const header = celulas(line);
      i += 2;
      const corpo: string[][] = [];
      while (i < lines.length && ehLinhaTabela(lines[i])) {
        corpo.push(celulas(lines[i]));
        i++;
      }
      i--;
      const ths = header.map((c) => `<th>${mdInline(c)}</th>`).join("");
      const trs = corpo
        .map(
          (r) =>
            `<tr>${header
              .map((_, j) => `<td>${mdInline(r[j] ?? "")}</td>`)
              .join("")}</tr>`
        )
        .join("");
      out.push(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      out.push(`<blockquote>${mdInline(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      out.push(`<li>${mdInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flush();
      out.push("<hr/>");
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    para.push(mdInline(line));
  }
  flush();
  return out.join("\n");
}

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await one<{
    id: number;
    edital_id: number;
    titulo: string;
    conteudo: string;
    modo: string;
    status: string;
    criado_em: string;
  }>("SELECT * FROM propostas WHERE id = ?", [id]);
  if (!p) notFound();

  const gerando = p.status === "gerando";
  const erro = p.status === "erro";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* enquanto gera, recarrega a página a cada 5s para mostrar quando ficar pronta */}
      {gerando && <meta httpEquiv="refresh" content="5" />}

      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/editais/${p.edital_id}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← voltar para o edital
        </Link>
        {!gerando && !erro && (
          <a href={`/api/propostas/${p.id}/docx`} className="btn btn-primary">
            ⬇ Baixar .docx
          </a>
        )}
      </div>

      {gerando ? (
        <div className="card card-glow p-10 text-center space-y-4">
          <div className="text-5xl animate-pulse">✍️</div>
          <div className="text-xl font-bold">Escrevendo a proposta...</div>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            O Claude está moldando o banco de textos ao objeto deste edital.
            Isso costuma levar de <b>1 a 4 minutos</b> — esta página atualiza
            sozinha quando ficar pronta. Pode deixar aberta. ☕
          </p>
          <div className="text-xs text-muted">
            Rascunho #{p.id} · {fmtData(p.criado_em)}
          </div>
        </div>
      ) : erro ? (
        <div className="card p-8 border-rose-400/40">
          <div className="text-lg font-bold text-rose-300 mb-2">
            ❌ Falha ao gerar a proposta
          </div>
          <p className="text-sm text-muted">{p.conteudo}</p>
          <Link
            href={`/editais/${p.edital_id}`}
            className="btn btn-ghost mt-4 inline-flex"
          >
            ← voltar e tentar de novo
          </Link>
        </div>
      ) : (
        <div className="card p-8">
          <div className="text-xs text-muted mb-4">
            Rascunho #{p.id} · gerado via {p.modo} · {fmtData(p.criado_em)} —
            revisar antes de submeter
          </div>
          <div
            className="prose-edital"
            dangerouslySetInnerHTML={{ __html: mdParaHtml(p.conteudo) }}
          />
        </div>
      )}
    </div>
  );
}
