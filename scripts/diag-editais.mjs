// Diagnóstico rápido do acervo de editais no Supabase.
//   node scripts/diag-editais.mjs
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

const total = await sql`SELECT count(*)::int n FROM editais`;
const abertos = await sql`
  SELECT count(*)::int n FROM editais
  WHERE fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date`;
const porModo = await sql`
  SELECT coalesce(analise_modo,'(nulo)') modo, count(*)::int n
  FROM editais GROUP BY 1 ORDER BY 2 DESC`;
const porStatus = await sql`
  SELECT status, count(*)::int n FROM editais GROUP BY 1 ORDER BY 2 DESC`;
const alvosAbertos = await sql`
  SELECT count(*)::int n FROM editais
  WHERE (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)
    AND status IN ('radar','triagem','match')
    AND (analise_modo IS NULL OR analise_modo = 'heuristica')`;

console.log("TOTAL editais:", total[0].n);
console.log("Com prazo ABERTO:", abertos[0].n);
console.log("\nPor analise_modo:");
for (const r of porModo) console.log(`  ${r.modo}: ${r.n}`);
console.log("\nPor status:");
for (const r of porStatus) console.log(`  ${r.status}: ${r.n}`);
console.log("\nALVOS p/ análise de qualidade (prazo aberto + heurística + status automático):", alvosAbertos[0].n);

await sql.end();
