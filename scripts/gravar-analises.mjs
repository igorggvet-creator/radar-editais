// Grava análises de qualidade (feitas pelo Claude diretamente nesta sessão)
// replicando a lógica de lib/analysis/analyzer.ts::analisarEdital:
// rederiva status a partir do score e marca analise_modo='claude-assinatura'.
//   node scripts/gravar-analises.mjs [caminho=scripts/analises.json]
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

const arquivo = process.argv[2] ?? "scripts/analises.json";
const analises = JSON.parse(fs.readFileSync(arquivo, "utf8"));
if (!Array.isArray(analises)) throw new Error("esperado um array de análises");

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", max: 3 });
const REAVALIAVEIS = ["radar", "triagem", "match"];
let ok = 0;
const resumo = [];

for (const a of analises) {
  const atual = (await sql`SELECT status FROM editais WHERE id = ${a.id}`)[0];
  if (!atual) { resumo.push(`#${a.id} NÃO ENCONTRADO`); continue; }
  const score = Math.max(0, Math.min(100, Math.round(a.score)));
  let novoStatus = atual.status;
  if (REAVALIAVEIS.includes(atual.status)) {
    if (score >= 60) novoStatus = "match";
    else if (score >= 30) novoStatus = "triagem";
    else novoStatus = "radar";
  }
  await sql`
    UPDATE editais SET
      analisado_em = now(), analise_modo = 'claude-assinatura', score = ${score},
      pilar_slug = ${a.pilar_slug ?? null}, empresa_slug = ${a.empresa_slug ?? null},
      pasta = ${a.pasta ?? null},
      elegibilidade = ${JSON.stringify(a.elegibilidade)},
      prazo_viavel = ${a.prazo_viavel ? 1 : 0},
      analise_resumo = ${a.resumo ?? null},
      briefing = ${JSON.stringify(a.briefing ?? { documentos: [], requisitos: [] })},
      status = ${novoStatus}, atualizado_em = now()
    WHERE id = ${a.id}`;
  ok++;
  resumo.push(`#${a.id} score ${score} → ${novoStatus} ${a.empresa_slug ?? "-"}/${a.pilar_slug ?? "-"}`);
}

console.log(`Gravadas ${ok}/${analises.length} análises:`);
for (const r of resumo) console.log("  " + r);
await sql.end();
