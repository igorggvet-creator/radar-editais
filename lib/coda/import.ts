// Importa os snapshots exportados do Coda (GJ+ Editais) para o banco:
// - historico_candidaturas: banco de referências + editais enviados 2025/2026
// - editais (fonte=coda): plataformas de patrocínio de fluxo contínuo
// Idempotente (dedup por chave/URL). Rode pela tela de Configurações.

import fs from "fs";
import path from "path";
import { all, run } from "../db";

const SNAP = path.join(process.cwd(), "lib", "coda", "snapshot");

function ler<T>(arquivo: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(SNAP, arquivo), "utf8")) as T;
  } catch {
    return null;
  }
}

function mapEmpresa(proponente: string): string | null {
  const p = proponente.toLowerCase();
  if (p.includes("startup grid") || p.includes("gj+") || p.includes("grid")) return "startup-grid";
  if (p.includes("acelera") || p.includes("indie hero") || p.includes("ih")) return "acelera-indie";
  if (p.includes("plug")) return "plug-and-plus";
  return null;
}

export interface ResultadoImport {
  historico: number;
  editais: number;
  erros: string[];
}

const SQL_HIST = `
  INSERT INTO historico_candidaturas
    (evento, proponente, empresa_slug, patrocinador, ano, data_envio,
     valor_solicitado, valor_aprovado, status, tags, observacoes, materiais, chave)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (chave) DO NOTHING RETURNING id`;

export async function importarCoda(): Promise<ResultadoImport> {
  const erros: string[] = [];
  let historico = 0;
  let editais = 0;

  // 1. Banco de referências
  const ref = ler<{ linhas: Record<string, string>[] }>("banco-de-referencias.json");
  for (const r of ref?.linhas ?? []) {
    const chave = `ref|${r["Evento/Ação"]}|${r["Edital/Patrocinador"]}|${r["Proponente"]}`;
    try {
      const res = await run(SQL_HIST, [
        r["Evento/Ação"] ?? "",
        r["Proponente"] ?? "",
        mapEmpresa(r["Proponente"] ?? ""),
        r["Edital/Patrocinador"] ?? "",
        r["Ano"] ?? "",
        null,
        null,
        null,
        r["Status"] ?? "",
        r["Tags"] ?? "",
        null,
        r["Materiais"] ?? null,
        chave,
      ]);
      historico += res.length;
    } catch (e) {
      erros.push(`ref ${r["Evento/Ação"]}: ${e instanceof Error ? e.message : e}`);
    }
  }

  // 2. Editais enviados 2025 e 2026
  for (const arq of ["editais-enviados-2025.json", "editais-enviados-2026.json"]) {
    const env = ler<{ linhas: Record<string, string>[] }>(arq);
    for (const r of env?.linhas ?? []) {
      const chave = `env|${arq}|${r["Evento/Edital"]}|${r["Patrocínio"]}|${r["Data de envio"] ?? ""}`;
      try {
        const res = await run(SQL_HIST, [
          r["Evento/Edital"] ?? "",
          r["Evento/Edital"] ?? "",
          mapEmpresa(r["Evento/Edital"] ?? ""),
          r["Patrocínio"] ?? "",
          arq.includes("2026") ? "2026" : "2025",
          r["Data de envio"] ?? null,
          r["Valor solicitado"] ?? null,
          r["Valor aprovado"] ?? null,
          r["Status"] ?? "",
          null,
          r["Observações"] ?? null,
          null,
          chave,
        ]);
        historico += res.length;
      } catch (e) {
        erros.push(`env ${r["Evento/Edital"]}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  // 3. Plataformas de patrocínio (fluxo contínuo) -> editais fonte=coda
  const fontes = ler<{ linhas: { nome: string; prazo: string; site: string; notas: string }[] }>(
    "fontes-patrocinio-continuo.json"
  );
  for (const f of fontes?.linhas ?? []) {
    try {
      const res = await run(
        `INSERT INTO editais (fonte, fonte_id, nome, orgao, url, descricao, fim_inscricoes, status)
         VALUES ('coda', ?, ?, ?, ?, ?, ?, 'radar')
         ON CONFLICT (fonte, fonte_id) DO NOTHING RETURNING id`,
        [
          f.site || f.nome,
          f.nome,
          "Lei de Incentivo / Patrocínio (via Coda)",
          f.site,
          `${f.notas}\n\nPrazo: ${f.prazo}`,
          null,
        ]
      );
      editais += res.length;
    } catch (e) {
      erros.push(`fonte ${f.nome}: ${e instanceof Error ? e.message : e}`);
    }
  }

  return { historico, editais, erros };
}

export interface ItemHistorico {
  evento: string;
  patrocinador: string;
  status: string;
  ano: string;
  valorAprovado: string | null;
}

export async function resumoHistorico(empresaSlug: string | null): Promise<{
  total: number;
  aprovados: number;
  itens: ItemHistorico[];
}> {
  const where = empresaSlug ? "WHERE empresa_slug = ?" : "";
  const args = empresaSlug ? [empresaSlug] : [];
  const itens = await all<ItemHistorico>(
    `SELECT evento, patrocinador, status, ano, valor_aprovado as "valorAprovado"
     FROM historico_candidaturas ${where}
     ORDER BY ano DESC, status LIMIT 60`,
    args
  );
  const aprovados = itens.filter((i) => foiAprovado(i.status)).length;
  return { total: itens.length, aprovados, itens };
}

export function foiAprovado(status: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s.startsWith("aprovad");
}
