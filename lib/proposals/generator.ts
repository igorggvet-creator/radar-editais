// Fase 6 do fluxo: Escrita e Adaptação. Redige a proposta moldando os
// textos históricos do banco ao objeto da chamada pública.

import Anthropic from "@anthropic-ai/sdk";
import { all, one, run, EditalRow } from "../db";
import { MODELO, temClaude, resolverModoIa } from "../analysis/analyzer";
import { perguntarClaudeCli } from "../ai/cli";

interface TextoBanco { titulo: string; categoria: string; conteudo: string }

const INSTRUCOES_REDATOR = `Você é o redator de propostas do ecossistema GameJam+ / Indie Hero / Plug and Plus, especialista em editais públicos brasileiros de cultura, tecnologia, educação e fomento à economia criativa. Sua tarefa é redigir uma proposta completa e persuasiva em Markdown, moldando os textos históricos do banco de textos ao objeto do edital. Regras:
- Escreva em português brasileiro formal de edital, sem jargão de IA.
- Use os textos do banco como matéria-prima, adaptando ao objeto da chamada — não invente métricas nem cases que não estejam no banco.
- Estruture: Identificação do Proponente; Apresentação Institucional; Objeto e Justificativa; Objetivos (geral e específicos); Metodologia/Plano de Ação; Histórico e Capacidade Técnica; Métricas e Resultados; Cronograma sugerido; Orçamento (esqueleto com rubricas, sem valores inventados); Contrapartidas (quando fizer sentido).
- Onde faltar informação obrigatória, deixe um marcador claro [PREENCHER: ...].`;

async function briefDoEdital(edital: EditalRow): Promise<string> {
  const empresa = await empresaInfo(edital.empresa_slug);
  const textos = await textosDoPilar(edital.pilar_slug, edital.empresa_slug);
  return `## Edital
Nome: ${edital.nome}
Órgão: ${edital.orgao ?? "não informado"}
Valor total: ${edital.valor_total ? `${edital.moeda ?? "R$"} ${edital.valor_total}` : "não informado"}
Prazo final: ${edital.fim_inscricoes ?? "não informado"}
Descrição/regulamento:
${(edital.descricao ?? "(sem descrição)").slice(0, 8000)}

## Análise interna
${edital.analise_resumo ?? "—"}
Pilar: ${edital.pilar_slug ?? "—"} | Pasta: ${edital.pasta ?? "—"}

## Empresa executora
${empresa ? JSON.stringify({ razao_social: empresa.razao_social, cnpj: empresa.cnpj, municipio: empresa.municipio, uf: empresa.uf, cnae_principal: empresa.cnae_principal, apresentacao: empresa.apresentacao, metricas: JSON.parse(String(empresa.metricas)), portfolio: JSON.parse(String(empresa.portfolio)) }, null, 2) : "(não definida — sugerir a mais adequada)"}

## Banco de textos disponível
${textos.map((t) => `### ${t.titulo} [${t.categoria}]\n${t.conteudo}`).join("\n\n")}

Redija a proposta completa.`;
}

function textosDoPilar(pilarSlug: string | null, empresaSlug: string | null) {
  return all<TextoBanco>(
    `SELECT titulo, categoria, conteudo FROM banco_textos
     WHERE (pilar_slug = ? OR pilar_slug IS NULL)
        OR (empresa_slug = ? OR empresa_slug IS NULL)
     ORDER BY CASE WHEN pilar_slug = ? THEN 0 ELSE 1 END`,
    [pilarSlug, empresaSlug, pilarSlug]
  );
}

async function empresaInfo(empresaSlug: string | null) {
  if (!empresaSlug) return null;
  return (
    (await one<Record<string, unknown>>("SELECT * FROM empresas WHERE slug = ?", [
      empresaSlug,
    ])) ?? null
  );
}

async function propostaTemplate(edital: EditalRow): Promise<string> {
  const empresa = await empresaInfo(edital.empresa_slug);
  const textos = await textosDoPilar(edital.pilar_slug, edital.empresa_slug);
  const apresentacao =
    textos.find((t) => t.categoria === "apresentacao")?.conteudo ??
    "(adicionar apresentação institucional)";
  const metricas = textos.find((t) => t.categoria === "metricas")?.conteudo ?? "";
  const cases = textos.find((t) => t.categoria === "cases")?.conteudo ?? "";

  return `# Proposta — ${edital.nome}

## 1. Identificação do Proponente
${empresa ? `**Razão Social:** ${empresa.razao_social}
**CNPJ:** ${empresa.cnpj}
**Localização:** ${empresa.municipio} - ${empresa.uf}
${empresa.representante_legal ? `**Representante Legal:** ${empresa.representante_legal}` : ""}` : "(definir empresa executora)"}

## 2. Apresentação Institucional
${apresentacao}

## 3. Objeto da Proposta
(Adaptar ao objeto do edital: ${edital.nome}${edital.orgao ? `, promovido por ${edital.orgao}` : ""}.)

${edital.analise_resumo ? `> Análise interna: ${edital.analise_resumo}` : ""}

## 4. Histórico e Capacidade Técnica
${cases || "(inserir cases do pilar)"}

## 5. Métricas e Resultados
${metricas || "(inserir métricas do pilar)"}

## 6. Cronograma e Orçamento
(Preencher conforme teto do edital${edital.valor_total ? ` — valor total disponível: ${edital.moeda ?? "R$"} ${edital.valor_total}` : ""}.)

---
*Rascunho gerado automaticamente pelo Radar de Editais — revisar antes de submeter.*`;
}

// Redige o conteúdo da proposta conforme o modo de IA resolvido.
async function redigirConteudo(
  edital: EditalRow
): Promise<{ conteudo: string; modo: string }> {
  const modoAlvo = await resolverModoIa();

  async function viaApi(): Promise<string> {
    const client = new Anthropic();
    const stream = client.messages.stream({
      model: MODELO,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: [
        { type: "text", text: INSTRUCOES_REDATOR, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: await briefDoEdital(edital) }],
    });
    const final = await stream.finalMessage();
    const text = final.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("resposta sem texto");
    return text.text;
  }

  async function viaAssinatura(): Promise<string> {
    const md = await perguntarClaudeCli(
      `${INSTRUCOES_REDATOR}\n\nResponda APENAS com o Markdown da proposta (sem comentários antes ou depois).\n\n${await briefDoEdital(edital)}`,
      { timeoutMs: 420_000 }
    );
    return md.replace(/^```(?:markdown|md)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  }

  if (modoAlvo === "assinatura") {
    try {
      return { conteudo: await viaAssinatura(), modo: "claude-assinatura" };
    } catch (err) {
      console.error("[proposals] assinatura falhou:", err);
      if (temClaude()) {
        try {
          return { conteudo: await viaApi(), modo: "claude-api" };
        } catch {
          return { conteudo: await propostaTemplate(edital), modo: "template" };
        }
      }
      return { conteudo: await propostaTemplate(edital), modo: "template" };
    }
  }
  if (modoAlvo === "api") {
    try {
      return { conteudo: await viaApi(), modo: "claude-api" };
    } catch (err) {
      console.error("[proposals] API falhou, usando template:", err);
      return { conteudo: await propostaTemplate(edital), modo: "template" };
    }
  }
  return { conteudo: await propostaTemplate(edital), modo: "template" };
}

/**
 * Cria a proposta em estado "gerando" e retorna o id na hora (resposta
 * instantânea). A redação (lenta — pode levar minutos no claude -p) roda
 * depois via processarProposta(), atualizando a linha quando pronta.
 */
export async function criarPropostaPendente(
  editalId: number
): Promise<{ id: number }> {
  const edital = await one<{ id: number; nome: string; status: string }>(
    "SELECT id, nome, status FROM editais WHERE id = ?",
    [editalId]
  );
  if (!edital) throw new Error(`Edital ${editalId} não encontrado`);

  const r = await run(
    "INSERT INTO propostas (edital_id, titulo, conteudo, modo, status) VALUES (?, ?, '', 'gerando', 'gerando') RETURNING id",
    [editalId, `Proposta — ${edital.nome}`]
  );

  if (edital.status === "match" || edital.status === "triagem") {
    await run(
      "UPDATE editais SET status = 'escrita', atualizado_em = now() WHERE id = ?",
      [editalId]
    );
  }
  return { id: Number((r[0] as { id: number }).id) };
}

/** Processa uma proposta pendente (redige e grava). Idempotente o suficiente. */
export async function processarProposta(propostaId: number): Promise<void> {
  const prop = await one<{ edital_id: number }>(
    "SELECT edital_id FROM propostas WHERE id = ?",
    [propostaId]
  );
  if (!prop) return;
  const edital = await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [
    prop.edital_id,
  ]);
  if (!edital) return;

  try {
    const { conteudo, modo } = await redigirConteudo(edital);
    await run(
      "UPDATE propostas SET conteudo = ?, modo = ?, status = 'pronta' WHERE id = ?",
      [conteudo, modo, propostaId]
    );
  } catch (err) {
    console.error("[proposals] processarProposta falhou:", err);
    await run(
      "UPDATE propostas SET status = 'erro', conteudo = ?, modo = 'erro' WHERE id = ?",
      [`Falha ao gerar: ${err instanceof Error ? err.message : err}`, propostaId]
    );
  }
}

// Caminho síncrono (Telegram, scripts): cria e processa de uma vez.
export async function gerarProposta(editalId: number): Promise<{
  id: number;
  modo: string;
}> {
  const { id } = await criarPropostaPendente(editalId);
  await processarProposta(id);
  const p = await one<{ modo: string }>(
    "SELECT modo FROM propostas WHERE id = ?",
    [id]
  );
  return { id, modo: p?.modo ?? "template" };
}
