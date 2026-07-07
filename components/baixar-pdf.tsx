"use client";

// Gera um PDF estruturado da proposta usando o motor de impressão do próprio
// navegador (funciona igual no local e na Vercel, sem dependência pesada).
// Monta um documento A4 isolado (iframe) com tipografia de documento e dispara
// o "Salvar como PDF". Reaproveita o HTML que a página já renderiza do markdown.

const PRINT_CSS = `
  @page { size: A4; margin: 2cm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; line-height: 1.55; font-size: 11.5pt; }
  .meta { color: #777; font-size: 9pt; margin-bottom: 16pt; }
  h1 { font-size: 20pt; margin: 0 0 6pt; }
  h2 { font-size: 14pt; margin: 18pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 12pt 0 4pt; page-break-after: avoid; }
  h4 { font-size: 11.5pt; margin: 10pt 0 3pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; text-align: justify; }
  ul { margin: 0 0 8pt 20pt; padding: 0; }
  li { margin: 0 0 3pt; }
  blockquote { margin: 8pt 0; padding: 4pt 12pt; border-left: 3px solid #999; color: #555; font-style: italic; }
  hr { border: none; border-top: 1px solid #bbb; margin: 14pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; page-break-inside: avoid; font-size: 10.5pt; }
  th, td { border: 1px solid #999; padding: 5pt 8pt; text-align: left; vertical-align: top; }
  th { background: #f0eef5; }
  strong { font-weight: 700; }
`;

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

export function BaixarPdf({
  titulo,
  html,
  meta,
}: {
  titulo: string;
  html: string;
  meta?: string;
}) {
  function gerar() {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      return;
    }
    const doc = win.document;
    doc.open();
    doc.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">` +
        `<title>${esc(titulo)}</title><style>${PRINT_CSS}</style></head>` +
        `<body>${meta ? `<div class="meta">${esc(meta)}</div>` : ""}${html}</body></html>`
    );
    doc.close();

    let limpo = false;
    const limpar = () => {
      if (limpo) return;
      limpo = true;
      setTimeout(() => iframe.remove(), 500);
    };
    win.onafterprint = limpar;
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(limpar, 60_000); // fallback se onafterprint não disparar
    }, 350);
  }

  return (
    <button
      onClick={gerar}
      className="btn btn-primary"
      title="Abre uma versão formatada (A4) e salva como PDF"
    >
      ⬇ Baixar PDF
    </button>
  );
}
