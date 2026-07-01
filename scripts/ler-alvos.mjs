// Lê os próximos alvos para análise de qualidade (prazo aberto + ainda
// heurística + status automático), ordenados por score heurístico desc.
// Como os já-analisados saem do filtro (viram claude-assinatura), basta
// rodar de novo para pegar o próximo lote.
//   node scripts/ler-alvos.mjs [limite=12]
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function carregarEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
carregarEnv();

const limite = Math.max(1, Math.min(20, parseInt(process.argv[2] ?? "12", 10) || 12));
const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", max: 3 });

const rows = await sql`
  SELECT id, nome, orgao, fonte, areas, valor_total, moeda, fim_inscricoes,
         status, score AS score_heuristico, descricao
  FROM editais
  WHERE (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)
    AND status IN ('radar','triagem','match')
    AND (analise_modo IS NULL OR analise_modo = 'heuristica')
  ORDER BY score DESC NULLS LAST, fim_inscricoes ASC NULLS LAST
  LIMIT ${limite}`;

const restantes = await sql`
  SELECT count(*)::int n FROM editais
  WHERE (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)
    AND status IN ('radar','triagem','match')
    AND (analise_modo IS NULL OR analise_modo = 'heuristica')`;

const out = rows.map((r) => ({
  id: r.id,
  nome: r.nome,
  orgao: r.orgao,
  fonte: r.fonte,
  areas: r.areas ? JSON.parse(r.areas) : [],
  valor_total: r.valor_total,
  moeda: r.moeda,
  fim_inscricoes: r.fim_inscricoes,
  status: r.status,
  score_heuristico: r.score_heuristico,
  descricao: (r.descricao ?? "").replace(/\s+/g, " ").slice(0, 1200),
}));

console.log(JSON.stringify({ restantes: restantes[0].n, lote: out }, null, 1));
await sql.end();
