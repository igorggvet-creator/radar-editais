import Link from "next/link";
import { all } from "@/lib/db";
import { PILAR_META, EMPRESA_META, fmtData } from "@/components/ui";

export const dynamic = "force-dynamic";

const PROP_META: Record<string, { label: string; emoji: string; cor: string }> = {
  pronta: { label: "Pronta", emoji: "✅", cor: "border-lime-400/50 text-lime-300" },
  gerando: { label: "Escrevendo…", emoji: "✍️", cor: "border-amber-400/50 text-amber-300" },
  erro: { label: "Erro", emoji: "❌", cor: "border-rose-400/50 text-rose-300" },
};

interface Row {
  id: number;
  proposta_status: string;
  modo: string | null;
  criado_em: string;
  edital_id: number;
  edital_nome: string;
  orgao: string | null;
  edital_status: string;
  empresa_slug: string | null;
  pilar_slug: string | null;
}

export default async function EscritosPage() {
  // um card por EDITAL escrito (a proposta mais recente de cada), mais novo primeiro
  const rows = await all<Row>(
    `SELECT DISTINCT ON (e.id)
       p.id, p.status AS proposta_status, p.modo, p.criado_em,
       e.id AS edital_id, e.nome AS edital_nome, e.orgao, e.status AS edital_status,
       e.empresa_slug, e.pilar_slug
     FROM propostas p JOIN editais e ON e.id = p.edital_id
     ORDER BY e.id, p.criado_em DESC`
  );
  rows.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const prontas = rows.filter((r) => r.proposta_status === "pronta").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">✍️ Editais Escritos</h1>
        <p className="text-muted mt-1">
          Todos os editais com proposta redigida — {rows.length} no total
          {prontas ? ` · ${prontas} pronta(s)` : ""}.
        </p>
      </header>

      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="card p-10 text-center text-muted">
            Nenhuma proposta escrita ainda. Abra um edital, clique em{" "}
            <b>✍️ Gerar proposta</b> e ele aparece aqui.
          </div>
        )}

        {rows.map((r) => {
          const pm = PROP_META[r.proposta_status] ?? PROP_META.pronta;
          const pilar = r.pilar_slug ? PILAR_META[r.pilar_slug] : null;
          return (
            <Link
              key={r.id}
              href={`/propostas/${r.id}`}
              className="card p-4 flex items-center gap-4 hover:card-glow transition-shadow"
            >
              <div className="text-2xl shrink-0" title={pm.label}>
                {pm.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{r.edital_nome}</div>
                <div className="text-sm text-muted truncate">
                  {r.orgao ?? "órgão não informado"}
                  {pilar ? ` · ${pilar.emoji} ${pilar.label}` : ""}
                  {r.empresa_slug ? ` · ${EMPRESA_META[r.empresa_slug] ?? r.empresa_slug}` : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`badge ${pm.cor}`}>{pm.label}</span>
                <div className="text-xs text-muted">
                  {r.modo ? `via ${r.modo} · ` : ""}
                  {fmtData(r.criado_em)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
