// Análise heurística local (fallback sem ANTHROPIC_API_KEY).
// Cruza o texto do edital com as keywords dos 4 pilares e os critérios
// internos do fluxograma: localização do CNPJ, competências, histórico
// e pasta da secretaria.

import { all } from "../db";
import { PASTAS } from "../seed-data";

export interface ResultadoAnalise {
  score: number;
  pilarSlug: string | null;
  empresaSlug: string | null;
  pasta: string | null;
  elegibilidade: {
    localizacao: { ok: boolean; nota: string };
    competencias: { ok: boolean; nota: string };
    historico: { ok: boolean; nota: string };
    pasta: { ok: boolean; nota: string };
  };
  prazoViavel: boolean;
  resumo: string;
  briefing: { documentos: string[]; requisitos: string[] };
}

const UFS_BRASIL = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// UFs onde o ecossistema tem CNPJ ativo (fluxograma: SC e DF; o cartão CNPJ
// da Acelera registra RJ — contamos as três e sinalizamos a divergência).
const UFS_ELEGIVEIS = new Set(["SC", "DF", "RJ"]);

const NOMES_UF: Record<string, string[]> = {
  AC: ["estado do acre"],
  AL: ["alagoas"],
  AP: ["estado do amapá", "estado do amapa"],
  AM: ["estado do amazonas"],
  BA: ["bahia"],
  CE: ["ceará", "estado do ceara"],
  DF: ["distrito federal", "brasília", "brasilia"],
  ES: ["espírito santo", "espirito santo"],
  GO: ["goiás", "estado de goias"],
  MA: ["maranhão", "maranhao"],
  MT: ["mato grosso"],
  MS: ["mato grosso do sul"],
  MG: ["minas gerais"],
  PA: ["estado do pará", "estado do para"],
  PB: ["paraíba", "paraiba"],
  PR: ["paraná", "estado do parana"],
  PE: ["pernambuco"],
  PI: ["piauí", "estado do piaui"],
  RJ: ["rio de janeiro"],
  RN: ["rio grande do norte"],
  RS: ["rio grande do sul"],
  RO: ["rondônia", "rondonia"],
  RR: ["roraima"],
  SC: ["santa catarina", "florianópolis", "florianopolis"],
  SP: ["são paulo", "sao paulo"],
  SE: ["sergipe"],
  TO: ["tocantins"],
};

export function detectarUf(texto: string): string | null {
  const lower = texto.toLowerCase();
  // "mato grosso do sul" precisa vencer "mato grosso"
  if (lower.includes("mato grosso do sul")) return "MS";
  for (const [uf, nomes] of Object.entries(NOMES_UF)) {
    if (nomes.some((n) => lower.includes(n))) return uf;
  }
  const m = texto.match(
    /\b(?:[Pp]refeitura|[Gg]overno|[Ss]ecretaria|[Ff]unda[çc][ãa]o|[Ii]nstituto)[^,.;]*?[\/\s-]([A-Z]{2})\b/
  );
  if (m && UFS_BRASIL.includes(m[1])) return m[1];
  return null;
}

export function diasAteOPrazo(fimInscricoes: string | null): number | null {
  if (!fimInscricoes) return null;
  const fim = new Date(fimInscricoes);
  if (isNaN(fim.getTime())) return null;
  return Math.floor((fim.getTime() - Date.now()) / 86_400_000);
}

// Termos centrais do ecossistema — valem mais que keywords genéricas.
const NUCLEO_GAMES = [
  "games",
  "jogos digitais",
  "jogos eletrônicos",
  "jogos eletronicos",
  "game jam",
  "gamejam",
  "esports",
  "e-sports",
  "desenvolvimento de jogos",
  "videogame",
  "indie",
];

const MUNICIPIOS_ELEGIVEIS = [
  "brasília",
  "brasilia",
  "florianópolis",
  "florianopolis",
  "rio de janeiro",
];

export async function analisarHeuristica(edital: {
  nome: string;
  orgao: string | null;
  descricao: string | null;
  areas: string[];
  fimInscricoes: string | null;
}): Promise<ResultadoAnalise> {
  const pilares = await all<{
    slug: string;
    nome: string;
    empresa_slug: string | null;
    keywords: string;
  }>("SELECT slug, nome, empresa_slug, keywords FROM pilares");

  const texto = [
    edital.nome,
    edital.orgao ?? "",
    edital.descricao ?? "",
    edital.areas.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  // pontuação por pilar via keywords
  let melhorPilar: { slug: string; empresa: string | null; hits: number } | null = null;
  for (const p of pilares) {
    const kws = JSON.parse(p.keywords) as string[];
    const hits = kws.filter((k) => texto.includes(k.toLowerCase())).length;
    if (hits > 0 && (!melhorPilar || hits > melhorPilar.hits)) {
      melhorPilar = { slug: p.slug, empresa: p.empresa_slug, hits };
    }
  }

  const nucleoGames = NUCLEO_GAMES.some((k) => texto.includes(k));

  // localização
  const uf = detectarUf(`${edital.nome} ${edital.orgao ?? ""} ${edital.descricao ?? ""}`);
  const restritoUf = uf !== null && !UFS_ELEGIVEIS.has(uf);
  // Editais de prefeituras/fundações municipais quase sempre exigem sede ou
  // atuação no município — penaliza, a menos que seja um município elegível.
  const orgaoLower = (edital.orgao ?? "").toLowerCase();
  const municipalForaDaBase =
    /prefeitura|municipal|município de|municipio de/.test(orgaoLower + " " + texto.slice(0, 400)) &&
    !MUNICIPIOS_ELEGIVEIS.some((m) => texto.includes(m));
  const restrito = restritoUf || municipalForaDaBase;
  const localizacao = {
    ok: !restrito,
    nota: restritoUf
      ? `Edital aparenta ser restrito a ${uf}, onde não há CNPJ ativo do ecossistema (SC, DF e RJ).`
      : municipalForaDaBase
        ? "Edital de órgão municipal fora das cidades-base (Brasília, Florianópolis, Rio) — provavelmente exige proponente local; conferir o regulamento."
        : uf
          ? `Edital ligado a ${uf} — há CNPJ elegível.`
          : "Sem restrição estadual aparente (âmbito nacional ou não identificado).",
  };

  // competências
  const competencias = {
    ok: melhorPilar !== null,
    nota: melhorPilar
      ? `Match com o pilar "${melhorPilar.slug}" (${melhorPilar.hits} keyword(s)).`
      : "Nenhuma keyword dos 4 pilares encontrada no texto do edital.",
  };

  // histórico (heurística: se o pilar tem empresa executora, há bagagem)
  const historico = {
    ok: melhorPilar !== null,
    nota: melhorPilar
      ? "O ecossistema possui cases e métricas registrados para este pilar no banco de textos."
      : "Sem pilar identificado, não há histórico mapeado para defender a proposta.",
  };

  // pasta da secretaria
  let pasta: string | null = null;
  if (/cultur|festival|audiovisual|rouanet|paulo gustavo|aldir blanc/.test(texto)) pasta = "eventos-culturais";
  else if (/educa|escola|ensino|capacita/.test(texto)) pasta = "educacao";
  else if (/empreend|startup|acelera|inova/.test(texto)) pasta = "empreendedorismo";
  else if (/games|jogos|tecnolog|software/.test(texto)) pasta = "tecnologia";
  else if (/viagem|missão|intercâmbio|mobilidade/.test(texto)) pasta = "mobilidade";

  const pastaCheck = {
    ok: pasta !== null,
    nota: pasta
      ? `Categorizado na pasta "${PASTAS.find((p) => p.slug === pasta)?.nome ?? pasta}".`
      : "Não foi possível categorizar em uma pasta de secretaria.",
  };

  // prazo
  const dias = diasAteOPrazo(edital.fimInscricoes);
  const prazoViavel = dias === null ? true : dias >= 10;

  // score — keywords genéricas valem menos; menção direta a games vale muito.
  let score = 0;
  if (melhorPilar) score += Math.min(25, melhorPilar.hits * 6);
  if (nucleoGames) score += 30;
  if (localizacao.ok) score += 15;
  if (pasta) score += 10;
  if (prazoViavel) score += 10;
  if (historico.ok) score += 10;
  if (!localizacao.ok) score = Math.min(score, 45); // restrição local derruba o teto
  score = Math.min(100, score);

  const resumo = [
    melhorPilar
      ? `Aderência ao pilar ${melhorPilar.slug}${melhorPilar.empresa ? ` (executora sugerida: ${melhorPilar.empresa})` : ""}.`
      : "Baixa aderência aos pilares do ecossistema.",
    localizacao.nota,
    dias !== null ? `Prazo: ${dias} dia(s) até o encerramento${prazoViavel ? "" : " — abaixo do mínimo de 10 dias para escrita"}.` : "Prazo de inscrição não informado.",
  ].join(" ");

  return {
    score,
    pilarSlug: melhorPilar?.slug ?? null,
    empresaSlug: melhorPilar?.empresa ?? null,
    pasta,
    elegibilidade: { localizacao, competencias, historico, pasta: pastaCheck },
    prazoViavel,
    resumo,
    briefing: {
      documentos: [
        "Cartão CNPJ atualizado da empresa executora",
        "Certidões negativas (federal, estadual, municipal, FGTS, trabalhista)",
        "Portfólio/cases do pilar correspondente",
        "Documentos do representante legal",
      ],
      requisitos: [
        "Verificar CNAEs exigidos no regulamento",
        "Confirmar teto financeiro e contrapartidas",
        "Validar formato de envio (plataforma ou anexo Word/PDF)",
      ],
    },
  };
}
