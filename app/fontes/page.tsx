import { all } from "@/lib/db";
import {
  FONTES_CATALOGO,
  NIVEIS_FONTE,
  FonteCatalogo,
} from "@/lib/fontes-catalogo";
import { EMPRESA_META } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FontesPage() {
  // contagem ao vivo por fonte (editais.fonte) — só Prosas é varrido hoje
  const counts = await all<{ fonte: string; c: number; ativos: number }>(
    `SELECT fonte, COUNT(*)::int c,
            SUM(CASE WHEN status NOT IN ('descartado','submetido') THEN 1 ELSE 0 END)::int ativos
     FROM editais GROUP BY fonte`
  );
  const countByFonte = new Map(counts.map((c) => [c.fonte, c]));

  const feedsRss = await all<{ nome: string; url: string; ativa: number }>(
    "SELECT nome, url, ativa FROM fontes_rss ORDER BY id"
  );

  const totalEditais = counts.reduce((a, c) => a + c.c, 0);
  const fontesAtivas = FONTES_CATALOGO.filter((f) => f.noRadar).length;

  function FonteCard({ f }: { f: FonteCatalogo }) {
    const cnt = f.fonteSlug ? countByFonte.get(f.fonteSlug) : undefined;
    return (
      <div
        className={`rounded-xl border p-4 ${
          f.noRadar
            ? "border-emerald-400/40 bg-emerald-400/5"
            : "border-border bg-surface-2"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-fuchsia-300"
            >
              {f.nome} ↗
            </a>
            <div className="text-xs text-muted mt-0.5">{f.tipo}</div>
          </div>
          {f.noRadar ? (
            <span className="badge border-emerald-400/50 text-emerald-300 shrink-0">
              🛰️ no radar
            </span>
          ) : (
            <span className="badge border-border text-muted shrink-0">
              👁️ manual
            </span>
          )}
        </div>

        {f.descricao && (
          <p className="text-sm text-muted mt-2 leading-relaxed">{f.descricao}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {cnt ? (
            <span className="badge border-cyan-400/50 text-cyan-300">
              {cnt.c} editais · {cnt.ativos} abertos
            </span>
          ) : null}
          {f.empresas?.map((slug) => (
            <span key={slug} className="badge border-violet-400/40 text-violet-300">
              {EMPRESA_META[slug] ?? slug}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          🌐 Fontes de Editais
        </h1>
        <p className="text-muted mt-1">
          Onde os editais são caçados — catalogado em níveis. A varredura
          automática roda no agregador (Nível 1); os demais são plataformas que
          o ecossistema monitora manualmente (mapeadas do Coda).
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-extrabold">{FONTES_CATALOGO.length}</div>
          <div className="text-sm text-muted">plataformas catalogadas</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-emerald-300">
            {fontesAtivas}
          </div>
          <div className="text-sm text-muted">🛰️ varridas automaticamente</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-cyan-300">{totalEditais}</div>
          <div className="text-sm text-muted">editais coletados</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-amber-300">
            {feedsRss.length}
          </div>
          <div className="text-sm text-muted">📰 feeds RSS configurados</div>
        </div>
      </div>

      {NIVEIS_FONTE.map((nivel) => {
        const fontes = FONTES_CATALOGO.filter((f) => f.nivel === nivel.nivel);
        const ehRss = nivel.nivel === 5;
        if (fontes.length === 0 && !ehRss) return null;
        return (
          <section key={nivel.nivel}>
            <div className="flex items-baseline gap-3 mb-1">
              <h2 className="text-lg font-bold">
                <span className="text-muted font-mono text-sm mr-2">
                  Nível {nivel.nivel}
                </span>
                {nivel.emoji} {nivel.nome}
              </h2>
            </div>
            <p className="text-sm text-muted mb-3">{nivel.descricao}</p>

            <div className="grid md:grid-cols-2 gap-3">
              {fontes.map((f) => (
                <FonteCard key={f.slug} f={f} />
              ))}

              {ehRss &&
                feedsRss.map((feed, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-surface-2 p-4"
                  >
                    <a
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-fuchsia-300 break-all"
                    >
                      {feed.nome} ↗
                    </a>
                    <div className="text-xs text-muted mt-1">
                      {feed.ativa ? "🛰️ ativo na varredura" : "pausado"}
                    </div>
                  </div>
                ))}

              {ehRss && feedsRss.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted md:col-span-2">
                  Nenhum feed RSS configurado. Adicione feeds de newsletters e
                  diários oficiais em{" "}
                  <a href="/config" className="text-fuchsia-300 hover:underline">
                    Configurações
                  </a>{" "}
                  — eles entram na varredura automática junto com a Prosas.
                </div>
              )}
            </div>
          </section>
        );
      })}

      <div className="card p-5 text-sm text-muted">
        💡 Os logins e credenciais de cada plataforma continuam no Coda (não são
        guardados aqui por segurança). Esta página é o mapa de <b>onde caçar</b>.
      </div>
    </div>
  );
}
