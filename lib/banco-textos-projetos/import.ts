// Importa o snapshot de projetos catalogados das 3 empresas para banco_textos.
// Idempotente: chave única (empresa_slug, categoria, titulo) — reimportar não duplica.
// Rode pela tela de Configurações → "Sincronizar Banco de Textos".

import fs from "fs";
import path from "path";
import { one, run } from "../db";

const SNAP = path.join(process.cwd(), "lib", "banco-textos-projetos", "snapshot");

export interface ProjetoCatalogado {
  projeto: string;
  patrocinador: string | null;
  ano: string | null;
  submissao_por: string | null;
  evento_alvo: string | null;
  escopo_curto: string | null;
  valor_solicitado: number | null;
  valor_moeda: string | null;
  duracao_meses: number | null;
  publico_alvo: string | null;
  resultados_esperados: string | null;
  temas: string[];
  pilar_sugerido: string | null;
  categoria_banco_textos: string;
  resumo_1_linha: string;
  qualidade_dados?: string;
  duplicado_de?: string;
}

export interface ResultadoImportProjetos {
  inseridos: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
}

function formatarValor(v: number | null): string {
  if (v === null || v === undefined) return "não informado";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function montarConteudo(p: ProjetoCatalogado): string {
  const linhas: string[] = [];
  linhas.push(p.resumo_1_linha);
  linhas.push("");
  if (p.patrocinador) linhas.push(`Patrocinador/Órgão: ${p.patrocinador}`);
  if (p.ano) linhas.push(`Ano: ${p.ano}`);
  if (p.submissao_por) linhas.push(`Submetido por: ${p.submissao_por}`);
  if (p.evento_alvo) linhas.push(`Objeto: ${p.evento_alvo}`);
  if (p.escopo_curto) linhas.push(`Escopo: ${p.escopo_curto}`);
  linhas.push(`Valor solicitado: ${formatarValor(p.valor_solicitado)}`);
  if (p.duracao_meses) linhas.push(`Duração: ${p.duracao_meses} meses`);
  if (p.publico_alvo) linhas.push(`Público-alvo: ${p.publico_alvo}`);
  if (p.resultados_esperados) linhas.push(`Resultados esperados: ${p.resultados_esperados}`);
  if (p.temas?.length) linhas.push(`Temas: ${p.temas.join(", ")}`);
  return linhas.join("\n");
}

const SQL_UPSERT = `
  INSERT INTO banco_textos (titulo, pilar_slug, empresa_slug, categoria, conteudo, origem)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT DO NOTHING
  RETURNING id`;

// Chave única lógica: (empresa_slug, categoria, titulo)
// Como banco_textos não tem UNIQUE constraint, verificamos manualmente
const SQL_EXISTE = `
  SELECT id, conteudo FROM banco_textos
  WHERE empresa_slug = ? AND categoria = ? AND titulo = ?
  LIMIT 1`;

const SQL_UPDATE = `
  UPDATE banco_textos
  SET conteudo = ?, pilar_slug = ?, origem = ?
  WHERE id = ?`;

const SQL_INSERT = `
  INSERT INTO banco_textos (titulo, pilar_slug, empresa_slug, categoria, conteudo, origem)
  VALUES (?, ?, ?, ?, ?, ?)
  RETURNING id`;

async function upsertProjeto(
  empresaSlug: string,
  p: ProjetoCatalogado,
): Promise<"inserido" | "atualizado" | "ignorado"> {
  if (p.duplicado_de) return "ignorado";

  const titulo = p.patrocinador
    ? `${p.projeto} — ${p.patrocinador}`
    : p.projeto;
  const categoria = p.categoria_banco_textos || "cases";
  const pilar = p.pilar_sugerido || null;
  const conteudo = montarConteudo(p);
  const origem = "projetos-locais";

  const existente = await one<{ id: number; conteudo: string }>(
    SQL_EXISTE,
    [empresaSlug, categoria, titulo],
  );

  if (existente) {
    if (existente.conteudo === conteudo) return "ignorado";
    await run(SQL_UPDATE, [conteudo, pilar, origem, existente.id]);
    return "atualizado";
  }

  await run(SQL_INSERT, [titulo, pilar, empresaSlug, categoria, conteudo, origem]);
  return "inserido";
}

export async function importarProjetos(): Promise<ResultadoImportProjetos> {
  const erros: string[] = [];
  let inseridos = 0;
  let atualizados = 0;
  let ignorados = 0;

  const arquivo = path.join(SNAP, "projetos.json");
  if (!fs.existsSync(arquivo)) {
    erros.push("snapshot 'projetos.json' não encontrado");
    return { inseridos, atualizados, ignorados, erros };
  }

  const raw = JSON.parse(fs.readFileSync(arquivo, "utf8")) as Record<
    string,
    { projetos: ProjetoCatalogado[] }
  >;

  for (const [empresaSlug, bloco] of Object.entries(raw)) {
    for (const p of bloco.projetos ?? []) {
      try {
        const r = await upsertProjeto(empresaSlug, p);
        if (r === "inserido") inseridos++;
        else if (r === "atualizado") atualizados++;
        else ignorados++;
      } catch (e) {
        erros.push(
          `${empresaSlug}/${p.projeto}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }

  return { inseridos, atualizados, ignorados, erros };
}
