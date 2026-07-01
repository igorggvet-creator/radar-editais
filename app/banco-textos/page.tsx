import { all } from "@/lib/db";
import { PILAR_META, EMPRESA_META } from "@/components/ui";

export const dynamic = "force-dynamic";

const CATEGORIA_META: Record<string, { label: string; cor: string }> = {
  apresentacao: { label: "Apresentação", cor: "border-cyan-400/50 text-cyan-300" },
  metricas: { label: "Métricas", cor: "border-lime-400/50 text-lime-300" },
  cases: { label: "Cases", cor: "border-amber-400/50 text-amber-300" },
  argumentacao: { label: "Argumentação", cor: "border-fuchsia-400/50 text-fuchsia-300" },
};

export default async function BancoTextosPage() {
  const textos = await all<{
    id: number;
    titulo: string;
    pilar_slug: string | null;
    empresa_slug: string | null;
    categoria: string;
    conteudo: string;
    origem: string;
  }>("SELECT * FROM banco_textos ORDER BY pilar_slug, categoria");

  const pilares = await all<{
    slug: string;
    nome: string;
    emoji: string;
    descricao: string;
    empresa_slug: string | null;
  }>("SELECT slug, nome, emoji, descricao, empresa_slug FROM pilares");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">📚 Banco de Textos</h1>
        <p className="text-muted mt-1">
          Matéria-prima das propostas — textos oficiais, métricas e cases por pilar.
          A IA usa exatamente estes textos na escrita (sem inventar números).
        </p>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {pilares.map((p) => (
          <div key={p.slug} className="card p-5">
            <div className="text-2xl">{p.emoji}</div>
            <div className="font-bold mt-1">{p.nome}</div>
            <div className="text-xs text-muted mt-1 leading-relaxed">{p.descricao}</div>
            {p.empresa_slug && (
              <div className="badge border-cyan-400/40 text-cyan-300 mt-3">
                🏢 {EMPRESA_META[p.empresa_slug]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {textos.map((t) => {
          const cat = CATEGORIA_META[t.categoria] ?? CATEGORIA_META.argumentacao;
          const pilar = t.pilar_slug ? PILAR_META[t.pilar_slug] : null;
          return (
            <div key={t.id} className="card p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge ${cat.cor}`}>{cat.label}</span>
                {pilar && (
                  <span className="badge border-violet-400/50 text-violet-300">
                    {pilar.emoji} {pilar.label}
                  </span>
                )}
                {t.empresa_slug && (
                  <span className="badge border-border text-muted">
                    {EMPRESA_META[t.empresa_slug] ?? t.empresa_slug}
                  </span>
                )}
                <span className="text-xs text-muted ml-auto">origem: {t.origem}</span>
              </div>
              <h2 className="font-bold">{t.titulo}</h2>
              <p className="text-sm text-muted leading-relaxed mt-2">{t.conteudo}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-5 text-sm text-muted">
        💡 Próximo passo: sincronizar com o CODA (Banco de referências) — a
        integração já tem espaço reservado; é só plugar um token de API do Coda.
      </div>
    </div>
  );
}
