// Lista o pipeline acionável: editais com prazo aberto e status match/triagem/escrita,
// já analisados (ordenado por score).  node scripts/top-oportunidades.mjs
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
const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", max: 3 });
const rows = await sql`
  SELECT id, nome, orgao, score, status, empresa_slug, pilar_slug,
         to_char(fim_inscricoes::date,'DD/MM/YYYY') AS prazo, valor_total
  FROM editais
  WHERE status IN ('match','triagem','escrita')
    AND (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)
  ORDER BY array_position(ARRAY['escrita','match','triagem'], status), score DESC NULLS LAST
  LIMIT 30`;
for (const r of rows) {
  const val = r.valor_total ? `R$${Number(r.valor_total).toLocaleString("pt-BR")}` : "—";
  console.log(`[${r.status.toUpperCase().padEnd(7)}] ${String(r.score).padStart(3)} | ${r.prazo ?? "contínuo"} | ${r.empresa_slug ?? "-"}/${r.pilar_slug ?? "-"} | ${val}`);
  console.log(`          ${r.nome.slice(0, 90)}`);
}
await sql.end();
