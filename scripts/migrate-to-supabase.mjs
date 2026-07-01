// Migração one-time: cria o schema no Supabase (Postgres) e copia todos os
// dados do SQLite local (data/radar.db). Idempotente — pode rodar de novo
// (TRUNCATE + reinsere). Lê DATABASE_URL do .env.local ou do ambiente.
//
//   node scripts/migrate-to-supabase.mjs

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import postgres from "postgres";

function carregarEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
carregarEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL ausente. Cole a connection string do Supabase no .env.local.");
  process.exit(1);
}

const TABELAS = [
  "empresas",
  "pilares",
  "banco_textos",
  "editais",
  "propostas",
  "fontes_rss",
  "config",
  "varreduras",
  "historico_candidaturas",
];
const COM_SERIAL = TABELAS.filter((t) => t !== "config");

const sqlite = new Database(path.join(process.cwd(), "data", "radar.db"), { readonly: true });
const sql = postgres(DATABASE_URL, { prepare: false, ssl: "require", max: 4 });

try {
  console.log("→ aplicando schema...");
  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  await sql.unsafe(schema);

  for (const t of TABELAS) {
    let rows;
    try {
      rows = sqlite.prepare(`SELECT * FROM ${t}`).all();
    } catch {
      console.log(`  ${t}: (não existe no SQLite, pulando)`);
      continue;
    }
    await sql.unsafe(`TRUNCATE ${t} RESTART IDENTITY CASCADE`);
    if (!rows.length) {
      console.log(`  ${t}: 0`);
      continue;
    }
    // insere em lotes de 200
    for (let i = 0; i < rows.length; i += 200) {
      const lote = rows.slice(i, i + 200);
      await sql`insert into ${sql(t)} ${sql(lote)}`;
    }
    console.log(`  ${t}: ${rows.length}`);
  }

  // realinha as sequences para max(id)+1
  for (const t of COM_SERIAL) {
    await sql.unsafe(
      `SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT MAX(id) FROM ${t}), 1))`
    );
  }

  console.log("✅ migração concluída.");
} catch (err) {
  console.error("❌ falhou:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
  sqlite.close();
}
