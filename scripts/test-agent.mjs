// Teste: roda a análise de um edital real via `claude -p` (assinatura),
// provando que dá pra usar o crédito da assinatura no lugar da API.
import Database from "better-sqlite3";
import { execSync } from "node:child_process";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data", "radar.db"));

// pega um edital com match e descrição (bom pra testar)
const e = db
  .prepare(
    `SELECT * FROM editais WHERE descricao IS NOT NULL AND length(descricao) > 200
     ORDER BY score DESC LIMIT 1`
  )
  .get();

if (!e) {
  console.log("Nenhum edital com descrição encontrado.");
  process.exit(0);
}

console.log("=== EDITAL DE TESTE ===");
console.log("Nome:", e.nome);
console.log("Órgão:", e.orgao);
console.log("Score heurístico atual:", e.score);
console.log("");

const prompt = `Você é o analista de editais do ecossistema GameJam+ / Indie Hero / Plug and Plus (jogos, economia criativa, educação, eventos). Empresas: Startup Grid/GameJam+ (DF), Acelera/Indie Hero (RJ/DF), Plug and Plus (SC).

Analise o edital abaixo e responda APENAS com um JSON válido (sem markdown, sem texto antes/depois) no formato:
{"score": <0-100>, "pilar": "<educacao|internacionalizacao|inovacao|eventos>", "empresa": "<startup-grid|acelera-indie|plug-and-plus>", "elegivel": <true|false>, "resumo": "<2 frases em pt-BR>"}

EDITAL:
Nome: ${e.nome}
Órgão: ${e.orgao ?? "n/d"}
Valor: ${e.valor_total ?? "n/d"}
Prazo: ${e.fim_inscricoes ?? "n/d"}
Descrição: ${(e.descricao ?? "").slice(0, 2500)}`;

console.log("=== CHAMANDO claude -p (assinatura, sem API key) ===");
const t0 = Date.now();
const out = execSync("claude -p", {
  input: prompt,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
const dt = ((Date.now() - t0) / 1000).toFixed(1);

console.log(out.trim());
console.log("");
console.log(`(respondido em ${dt}s)`);
