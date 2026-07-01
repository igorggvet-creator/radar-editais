import { all } from "@/lib/db";
import { resumoHistorico, foiAprovado } from "@/lib/coda/import";

export const dynamic = "force-dynamic";

interface Empresa {
  slug: string;
  razao_social: string;
  nome_fantasia: string;
  apelido: string;
  cnpj: string;
  data_abertura: string;
  porte: string;
  situacao: string;
  municipio: string;
  uf: string;
  uf_ficha_tecnica: string | null;
  observacao_endereco: string | null;
  representante_legal: string | null;
  cnae_principal: string;
  cnaes_secundarios: string;
  apresentacao: string;
  portfolio: string;
  clientes: string;
  parceiros: string;
  metricas: string;
  tags: string;
}

export default async function EmpresasPage() {
  const empresas = await all<Empresa>("SELECT * FROM empresas ORDER BY id");

  // pré-busca o track record (Coda) de cada empresa
  const hists = new Map<string, Awaited<ReturnType<typeof resumoHistorico>>>();
  await Promise.all(
    empresas.map(async (e) => hists.set(e.slug, await resumoHistorico(e.slug)))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          🏢 Empresas &amp; CNPJs
        </h1>
        <p className="text-muted mt-1">
          As três frentes do ecossistema — o motor de match escolhe a executora
          certa para cada edital.
        </p>
      </header>

      <div className="space-y-6">
        {empresas.map((e) => {
          const cnaes = JSON.parse(e.cnaes_secundarios) as string[];
          const metricas = JSON.parse(e.metricas) as string[];
          const portfolio = JSON.parse(e.portfolio) as string[];
          const clientes = JSON.parse(e.clientes) as string[];
          const tags = JSON.parse(e.tags) as string[];
          const hist = hists.get(e.slug) ?? { total: 0, aprovados: 0, itens: [] };
          return (
            <div key={e.slug} className="card p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">{e.apelido}</h2>
                  <div className="text-sm text-muted">
                    {e.razao_social}
                    {e.nome_fantasia ? ` · "${e.nome_fantasia}"` : ""}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-mono font-bold">{e.cnpj}</div>
                  <div className="text-muted">
                    {e.municipio} - {e.uf} · {e.porte || "—"} ·{" "}
                    <span className="text-lime-300">{e.situacao}</span>
                  </div>
                </div>
              </div>

              {e.observacao_endereco && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm text-amber-200 leading-relaxed">
                  {e.observacao_endereco}
                </div>
              )}

              <p className="text-sm leading-relaxed text-muted">{e.apresentacao}</p>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-fuchsia-300 mb-1">
                    CNAE principal
                  </div>
                  <div className="text-muted">{e.cnae_principal}</div>
                  <div className="font-semibold text-fuchsia-300 mt-3 mb-1">
                    CNAEs secundários
                  </div>
                  <ul className="text-muted space-y-0.5">
                    {cnaes.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                  {e.representante_legal && (
                    <div className="mt-3">
                      <span className="font-semibold text-fuchsia-300">
                        Representante legal:
                      </span>{" "}
                      <span className="text-muted">{e.representante_legal}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-fuchsia-300 mb-1">
                    Métricas para editais
                  </div>
                  <ul className="text-muted space-y-0.5">
                    {metricas.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                  <div className="font-semibold text-fuchsia-300 mt-3 mb-1">
                    Portfólio
                  </div>
                  <ul className="text-muted space-y-0.5">
                    {portfolio.slice(0, 4).map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => (
                  <span key={t} className="badge border-border text-muted">
                    {t}
                  </span>
                ))}
                {clientes.length > 0 && (
                  <span className="text-xs text-muted ml-auto self-center">
                    Clientes: {clientes.join(", ")}
                  </span>
                )}
              </div>

              {hist.total > 0 && (
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-sm font-semibold text-fuchsia-300 mb-2">
                    📜 Track record (Coda) — {hist.aprovados} aprovado(s) de {hist.total} candidatura(s)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hist.itens
                      .filter((i) => foiAprovado(i.status))
                      .slice(0, 12)
                      .map((i, idx) => (
                        <span
                          key={idx}
                          className="badge border-lime-400/40 text-lime-300"
                          title={`${i.evento}${i.valorAprovado ? ` · ${i.valorAprovado}` : ""}`}
                        >
                          ✓ {i.patrocinador} ({i.ano})
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
