// Remove do banco todos os editais analisados apenas por heurística
// (e propostas vinculadas a eles). Mantém os analisados com Claude.
import Database from "better-sqlite3";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data", "radar.db"));

const antes = db.prepare("SELECT COUNT(*) c FROM editais").get();
const props = db
  .prepare(
    `DELETE FROM propostas WHERE edital_id IN (
       SELECT id FROM editais WHERE analise_modo = 'heuristica' OR analise_modo IS NULL
     )`
  )
  .run();
const eds = db
  .prepare(
    "DELETE FROM editais WHERE analise_modo = 'heuristica' OR analise_modo IS NULL"
  )
  .run();
const depois = db.prepare("SELECT COUNT(*) c FROM editais").get();

console.log(`editais antes: ${antes.c}`);
console.log(`removidos (heurística): ${eds.changes}`);
console.log(`propostas vinculadas removidas: ${props.changes}`);
console.log(`restantes (analisados com Claude): ${depois.c}`);
const restantes = db
  .prepare("SELECT id, nome, score, analise_modo, status FROM editais")
  .all();
for (const r of restantes) {
  console.log(` - [${r.id}] ${r.nome.slice(0, 60)} | score ${r.score} | ${r.analise_modo} | ${r.status}`);
}
