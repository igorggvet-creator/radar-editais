// Análise de editais com Claude (structured output via output_config.format).
// Sem ANTHROPIC_API_KEY cai no modo heurístico local.

import Anthropic from "@anthropic-ai/sdk";
import { all, one, run, getConfig, EditalRow } from "../db";
import { analisarHeuristica, ResultadoAnalise, diasAteOPrazo } from "./heuristics";
import { cliDisponivel, perguntarClaudeCli, extrairJson } from "../ai/cli";

export const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

/** Há chave de API configurada? (caminho pago por créditos de API) */
export function temClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type ModoIa = "assinatura" | "api" | "heuristica";

/**
 * Resolve o modo de IA efetivo a partir da configuração (`modo_ia`):
 * - "auto" (padrão): assinatura (CLI logado) > API (chave) > heurística
 * - valor explícito: usa se disponível; senão cai na cadeia.
 */
export async function resolverModoIa(): Promise<ModoIa> {
  const configurado = ((await getConfig("modo_ia")) ?? "auto") as ModoIa | "auto";
  const cli = await cliDisponivel();

  if (configurado === "heuristica") return "heuristica";
  if (configurado === "assinatura") return cli.ok ? "assinatura" : temClaude() ? "api" : "heuristica";
  if (configurado === "api") return temClaude() ? "api" : cli.ok ? "assinatura" : "heuristica";
  // auto
  if (cli.ok) return "assinatura";
  if (temClaude()) return "api";
  return "heuristica";
}

/** Info completa para UI/status. */
export async function modoIaInfo() {
  const cli = await cliDisponivel();
  const resolvido = await resolverModoIa();
  return {
    configurado: ((await getConfig("modo_ia")) ?? "auto") as ModoIa | "auto",
    resolvido,
    cliDisponivel: cli.ok,
    cliVersao: cli.versao,
    apiDisponivel: temClaude(),
    rotulo:
      resolvido === "assinatura"
        ? "Claude (assinatura)"
        : resolvido === "api"
          ? "Claude (API)"
          : "heurística local",
  };
}

const SCHEMA_ANALISE = {
  type: "object" as const,
  properties: {
    score: { type: "integer", description: "0 a 100 — potencial de participação" },
    pilar_slug: {
      type: ["string", "null"],
      enum: ["educacao", "internacionalizacao", "inovacao", "eventos", null],
      description: "Pilar estratégico com maior aderência",
    },
    empresa_slug: {
      type: ["string", "null"],
      enum: ["startup-grid", "acelera-indie", "plug-and-plus", null],
      description: "CNPJ/empresa executora recomendada",
    },
    pasta: {
      type: ["string", "null"],
      enum: ["tecnologia", "eventos-culturais", "empreendedorismo", "mobilidade", "educacao", null],
    },
    elegibilidade: {
      type: "object",
      properties: {
        localizacao: { $ref: "#/$defs/criterio" },
        competencias: { $ref: "#/$defs/criterio" },
        historico: { $ref: "#/$defs/criterio" },
        pasta: { $ref: "#/$defs/criterio" },
      },
      required: ["localizacao", "competencias", "historico", "pasta"],
      additionalProperties: false,
    },
    prazo_viavel: { type: "boolean" },
    resumo: { type: "string", description: "2-4 frases, em português, direto ao ponto" },
    briefing: {
      type: "object",
      properties: {
        documentos: { type: "array", items: { type: "string" } },
        requisitos: { type: "array", items: { type: "string" } },
      },
      required: ["documentos", "requisitos"],
      additionalProperties: false,
    },
  },
  required: ["score", "pilar_slug", "empresa_slug", "pasta", "elegibilidade", "prazo_viavel", "resumo", "briefing"],
  additionalProperties: false,
  $defs: {
    criterio: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        nota: { type: "string" },
      },
      required: ["ok", "nota"],
      additionalProperties: false,
    },
  },
};

async function contextoEcossistema(): Promise<string> {
  const empresas = await all<Record<string, unknown>>("SELECT * FROM empresas");
  const pilares = await all<Record<string, unknown>>("SELECT * FROM pilares");
  return `## Empresas do ecossistema (CNPJs disponíveis)
${empresas
  .map(
    (e) => `- slug: ${e.slug} | ${e.razao_social} ("${e.apelido}") | CNPJ ${e.cnpj} | ${e.municipio}-${e.uf}${e.observacao_endereco ? ` | ${e.observacao_endereco}` : ""}
  CNAE principal: ${e.cnae_principal}
  CNAEs secundários: ${(JSON.parse(String(e.cnaes_secundarios)) as string[]).join("; ")}
  Apresentação: ${e.apresentacao}
  Métricas: ${(JSON.parse(String(e.metricas)) as string[]).join("; ")}`
  )
  .join("\n")}

## Pilares estratégicos
${pilares
  .map(
    (p) => `- slug: ${p.slug} | ${p.nome} | executora preferencial: ${p.empresa_slug ?? "qualquer"} | ${p.descricao}`
  )
  .join("\n")}

## Critérios do fluxo interno
1. Localização do CNPJ: validar restrições estaduais. CNPJs ativos: SC (Plug and Plus, Florianópolis), DF (Startup Grid, Brasília) e RJ (cartão CNPJ da Acelera Indie Plus registra Rio de Janeiro; a ficha interna diz Brasília-DF — sinalize quando isso for relevante).
2. Competências e Escopo: qual frente (Indie Hero, GameJamPlus ou Plug and Plus) atende aos requisitos.
3. Disponibilidade de Histórico: o ecossistema tem bagagem prévia para defender a proposta?
4. Pasta da Secretaria: Tecnologia (Games), Eventos Culturais (GJ+), Empreendedorismo (Premiações), Mobilidade (Viagens/Palestras) ou Educação (Games/Incubação).
5. Viabilidade: prazo mínimo de 10 dias para escrita; teto financeiro deve justificar o esforço.`;
}

// Track record real (do Coda) para calibrar a análise de histórico.
async function contextoHistorico(): Promise<string> {
  const aprovados = await all<{
    evento: string;
    patrocinador: string;
    ano: string;
    valor_aprovado: string | null;
  }>(
    `SELECT evento, patrocinador, ano, valor_aprovado
     FROM historico_candidaturas
     WHERE status ILIKE 'Aprovad%' ORDER BY ano DESC LIMIT 25`
  );
  if (!aprovados.length) return "";
  return `\n\n## Histórico real de candidaturas APROVADAS (use como prova de bagagem/elegibilidade)\n${aprovados
    .map(
      (a) =>
        `- ${a.ano}: "${a.evento}" via ${a.patrocinador}${a.valor_aprovado ? ` (aprovado: ${a.valor_aprovado})` : ""}`
    )
    .join("\n")}`;
}

export async function analisarComClaude(
  edital: EditalInput
): Promise<ResultadoAnalise> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: `Você é o analista de editais do ecossistema GameJam+ / Indie Hero / Plug and Plus. Avalie o potencial de participação do edital cruzando o regulamento com os critérios internos. Seja honesto: edital ruim recebe score baixo e a recomendação de descarte. Responda em português brasileiro.\n\n${await contextoEcossistema()}${await contextoHistorico()}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: promptAnalise(edital),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: SCHEMA_ANALISE,
      },
    },
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Resposta sem texto");
  const data = JSON.parse(text.text);

  return {
    score: data.score,
    pilarSlug: data.pilar_slug,
    empresaSlug: data.empresa_slug,
    pasta: data.pasta,
    elegibilidade: data.elegibilidade,
    prazoViavel: data.prazo_viavel,
    resumo: data.resumo,
    briefing: data.briefing,
  };
}

interface EditalInput {
  nome: string;
  orgao: string | null;
  descricao: string | null;
  areas: string[];
  fimInscricoes: string | null;
  valorTotal: string | null;
  url: string | null;
}

function promptAnalise(edital: EditalInput): string {
  const dias = diasAteOPrazo(edital.fimInscricoes);
  return `Analise este edital:

Nome: ${edital.nome}
Órgão/Incentivador: ${edital.orgao ?? "não informado"}
Áreas de interesse: ${edital.areas.join(", ") || "não informadas"}
Valor total disponível: ${edital.valorTotal ?? "não informado"}
Encerramento das inscrições: ${edital.fimInscricoes ?? "não informado"}${dias !== null ? ` (${dias} dias a partir de hoje)` : ""}
Link: ${edital.url ?? "—"}

Descrição/regulamento:
${(edital.descricao ?? "(sem descrição disponível)").slice(0, 6000)}`;
}

// Análise via assinatura (claude -p). Mesmo conhecimento, mesma saída JSON.
export async function analisarComAssinatura(
  edital: EditalInput
): Promise<ResultadoAnalise> {
  const prompt = `Você é o analista de editais do ecossistema GameJam+ / Indie Hero / Plug and Plus. Avalie o potencial de participação do edital cruzando o regulamento com os critérios internos. Seja honesto: edital ruim recebe score baixo e a recomendação de descarte.

${await contextoEcossistema()}${await contextoHistorico()}

${promptAnalise(edital)}

Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) exatamente neste formato:
{
 "score": <inteiro 0-100>,
 "pilar_slug": <"educacao"|"internacionalizacao"|"inovacao"|"eventos"|null>,
 "empresa_slug": <"startup-grid"|"acelera-indie"|"plug-and-plus"|null>,
 "pasta": <"tecnologia"|"eventos-culturais"|"empreendedorismo"|"mobilidade"|"educacao"|null>,
 "elegibilidade": {
  "localizacao": {"ok": <bool>, "nota": "<frase>"},
  "competencias": {"ok": <bool>, "nota": "<frase>"},
  "historico": {"ok": <bool>, "nota": "<frase>"},
  "pasta": {"ok": <bool>, "nota": "<frase>"}
 },
 "prazo_viavel": <bool>,
 "resumo": "<2-4 frases em pt-BR>",
 "briefing": {"documentos": ["..."], "requisitos": ["..."]}
}`;

  const resposta = await perguntarClaudeCli(prompt, { timeoutMs: 180_000 });
  const data = extrairJson<{
    score: number;
    pilar_slug: string | null;
    empresa_slug: string | null;
    pasta: string | null;
    elegibilidade: ResultadoAnalise["elegibilidade"];
    prazo_viavel: boolean;
    resumo: string;
    briefing: { documentos: string[]; requisitos: string[] };
  }>(resposta);

  return {
    score: Math.max(0, Math.min(100, Math.round(data.score))),
    pilarSlug: data.pilar_slug,
    empresaSlug: data.empresa_slug,
    pasta: data.pasta,
    elegibilidade: data.elegibilidade,
    prazoViavel: data.prazo_viavel,
    resumo: data.resumo,
    briefing: data.briefing,
  };
}

export async function analisarEdital(
  editalId: number,
  opts?: { forcarModo?: ModoIa }
): Promise<EditalRow> {
  const edital = await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [editalId]);
  if (!edital) throw new Error(`Edital ${editalId} não encontrado`);

  const input: EditalInput = {
    nome: edital.nome,
    orgao: edital.orgao,
    descricao: edital.descricao,
    areas: edital.areas ? (JSON.parse(edital.areas) as string[]) : [],
    fimInscricoes: edital.fim_inscricoes,
    valorTotal: edital.valor_total,
    url: edital.url,
  };

  const modoAlvo = opts?.forcarModo ?? (await resolverModoIa());
  let resultado: ResultadoAnalise;
  let modo: string;

  if (modoAlvo === "assinatura") {
    try {
      resultado = await analisarComAssinatura(input);
      modo = "claude-assinatura";
    } catch (err) {
      console.error("[analyzer] assinatura falhou:", err);
      if (temClaude()) {
        try {
          resultado = await analisarComClaude(input);
          modo = "claude-api";
        } catch {
          resultado = await analisarHeuristica(input);
          modo = "heuristica";
        }
      } else {
        resultado = await analisarHeuristica(input);
        modo = "heuristica";
      }
    }
  } else if (modoAlvo === "api") {
    try {
      resultado = await analisarComClaude(input);
      modo = "claude-api";
    } catch (err) {
      console.error("[analyzer] API falhou, usando heurística:", err);
      resultado = await analisarHeuristica(input);
      modo = "heuristica";
    }
  } else {
    resultado = await analisarHeuristica(input);
    modo = "heuristica";
  }

  // status rederivado do score real — corrige falso-positivo da heurística
  // (ex.: match 89 heurístico → 8 no Claude rebaixa de match p/ triagem/radar).
  // Só mexe em estados de triagem automática; respeita decisões humanas
  // (escrita, submetido, descartado).
  const reavaliaveis = ["radar", "triagem", "match"];
  let novoStatus = edital.status;
  if (reavaliaveis.includes(edital.status)) {
    if (resultado.score >= 60) novoStatus = "match";
    else if (resultado.score >= 30) novoStatus = "triagem";
    else novoStatus = "radar";
  }

  await run(
    `UPDATE editais SET
      analisado_em = now(), analise_modo = ?, score = ?,
      pilar_slug = ?, empresa_slug = ?, pasta = ?,
      elegibilidade = ?, prazo_viavel = ?, analise_resumo = ?,
      briefing = ?, status = ?, atualizado_em = now()
     WHERE id = ?`,
    [
      modo,
      resultado.score,
      resultado.pilarSlug,
      resultado.empresaSlug,
      resultado.pasta,
      JSON.stringify(resultado.elegibilidade),
      resultado.prazoViavel ? 1 : 0,
      resultado.resumo,
      JSON.stringify(resultado.briefing),
      novoStatus,
      editalId,
    ]
  );

  return (await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [editalId]))!;
}
