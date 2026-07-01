// Converte a proposta (markdown) em .docx para download.
// Suporta títulos, negrito, listas, citações, separadores E tabelas markdown.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

// ---------- helpers de tabela markdown ----------
function ehLinhaTabela(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}
function ehSeparadorTabela(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}
function celulas(line: string): string[] {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split("|").map((c) => c.trim());
}

function mdLineToParagraph(line: string): Paragraph {
  const h = line.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const levels = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
    ];
    return new Paragraph({
      text: h[2].replace(/\*\*/g, ""),
      heading: levels[h[1].length - 1],
      spacing: { before: 240, after: 120 },
    });
  }
  if (/^[-*]\s+/.test(line)) {
    return new Paragraph({
      children: runsFromInline(line.replace(/^[-*]\s+/, "")),
      bullet: { level: 0 },
    });
  }
  if (/^>\s?/.test(line)) {
    return new Paragraph({
      children: [
        new TextRun({
          text: line.replace(/^>\s?/, "").replace(/\*\*/g, ""),
          italics: true,
          color: "555555",
        }),
      ],
      indent: { left: 400 },
    });
  }
  if (/^---+$/.test(line.trim())) {
    return new Paragraph({ text: "", border: { bottom: { color: "999999", space: 1, style: "single", size: 6 } } });
  }
  return new Paragraph({
    children: runsFromInline(line),
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function runsFromInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) runs.push(new TextRun({ text: bold[1], bold: true }));
    else runs.push(new TextRun({ text: part }));
  }
  return runs.length ? runs : [new TextRun({ text: "" })];
}

const BORDA = { style: BorderStyle.SINGLE, size: 2, color: "B9A8D6" };

function celulaDocx(texto: string, header: boolean): TableCell {
  const runs = header
    ? [new TextRun({ text: texto.replace(/\*\*/g, ""), bold: true })]
    : runsFromInline(texto);
  return new TableCell({
    children: [new Paragraph({ children: runs, spacing: { after: 0 } })],
    shading: header ? { fill: "EFE7F7" } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
  });
}

function construirTabelaDocx(header: string[], linhas: string[][]): Table {
  const nCols = header.length;
  const norm = (r: string[]) =>
    Array.from({ length: nCols }, (_, i) => r[i] ?? "");
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDA,
      bottom: BORDA,
      left: BORDA,
      right: BORDA,
      insideHorizontal: BORDA,
      insideVertical: BORDA,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: header.map((c) => celulaDocx(c, true)),
      }),
      ...linhas.map(
        (r) =>
          new TableRow({ children: norm(r).map((c) => celulaDocx(c, false)) })
      ),
    ],
  });
}

export async function propostaParaDocx(markdown: string): Promise<Buffer> {
  const lines = markdown.split(/\r?\n/);
  const children: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // bloco de tabela: linha "| ... |" seguida de separador "|---|---|"
    if (ehLinhaTabela(line) && i + 1 < lines.length && ehSeparadorTabela(lines[i + 1])) {
      const header = celulas(line);
      i += 2;
      const corpo: string[][] = [];
      while (i < lines.length && ehLinhaTabela(lines[i])) {
        corpo.push(celulas(lines[i]));
        i++;
      }
      children.push(construirTabelaDocx(header, corpo));
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    if (line.trim() === "" && lines[i - 1]?.trim() === "") {
      i++;
      continue;
    }
    children.push(
      line.trim() === "" ? new Paragraph({ text: "" }) : mdLineToParagraph(line)
    );
    i++;
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
