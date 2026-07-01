import { notFound } from "next/navigation";
import Link from "next/link";
import { all, one, EditalRow } from "@/lib/db";
import {
  StatusBadge,
  ScoreRing,
  fmtData,
  PrazoChip,
  PILAR_META,
  EMPRESA_META,
} from "@/components/ui";
import { EditalActions } from "@/components/edital-actions";
import { fonteDeEdital } from "@/lib/fontes-catalogo";

export const dynamic = "force-dynamic";

interface Criterio {
  ok: boolean;
  nota: string;
}

export default async function EditalDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [id]);
  if (!e) notFound();

  const propostas = await all<{
    id: number;
    titulo: string;
    modo: string;
    status: string;
    criado_em: string;
  }>(
    "SELECT id, titulo, modo, status, criado_em FROM propostas WHERE edital_id = ? ORDER BY id DESC",
    [id]
  );

  const eleg = e.elegibilidade
    ? (JSON.parse(e.elegibilidade) as Record<string, Criterio>)
    : null;
  const briefing = e.briefing
    ? (JSON.parse(e.briefing) as { documentos: string[]; requisitos: string[] })
    : null;
  const areas = e.areas ? (JSON.parse(e.areas) as string[]) : [];
  const pilar = e.pilar_slug ? PILAR_META[e.pilar_slug] : null;
  const fonte = fonteDeEdital(e.fonte);

  const CRITERIO_LABEL: Record<string, string> = {
    localizacao: "📍 Localização do CNPJ",
    competencias: "🛠️ Competências e Escopo",
    historico: "🗄️ Disponibilidade de Histórico",
    pasta: "🗂️ Pasta da Secretaria",
  };

  return (
    <div className="space-y-6">
      <Link href="/editais" className="text-sm text-muted hover:text-ink">
        ← voltar para editais
      </Link>

      <header className="card card-glow p-6 flex flex-wrap items-start gap-5">
        <ScoreRing score={e.score} />
        <div className="flex-1 min-w-64">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={e.status} />
            {pilar && (
              <span className="badge border-violet-400/50 text-violet-300">
                {pilar.emoji} {pilar.label}
              </span>
            )}
            {e.empresa_slug && (
              <span className="badge border-cyan-400/50 text-cyan-300">
                🏢 {EMPRESA_META[e.empresa_slug] ?? e.empresa_slug}
              </span>
            )}
            {fonte.url ? (
              <a
                href={fonte.url}
                target="_blank"
                rel="noopener noreferrer"
                className="badge border-emerald-400/50 text-emerald-300 hover:border-emerald-300"
                title="Plataforma onde o radar encontrou este edital"
              >
                {fonte.emoji} encontrado em: {fonte.nome} ↗
              </a>
            ) : (
              <span className="badge border-border text-muted">
                {fonte.emoji} encontrado em: {fonte.nome}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold leading-snug">{e.nome}</h1>
          <div className="text-muted mt-1">
            {e.orgao ?? "órgão não informado"}
            {areas.length > 0 && ` · ${areas.join(", ")}`}
          </div>
          <div className="flex flex-wrap gap-5 mt-3 text-sm">
            <div>
              💰{" "}
              {e.valor_total
                ? `${e.moeda ?? "R$"} ${Number(e.valor_total).toLocaleString("pt-BR")}`
                : "valor não informado"}
            </div>
            <div className="flex items-center gap-2">
              📅 {fmtData(e.inicio_inscricoes)} → {fmtData(e.fim_inscricoes)}{" "}
              <PrazoChip fim={e.fim_inscricoes} />
            </div>
            {e.url && (
              <a
                href={e.url}
                target="_blank"
                className="text-cyan-300 hover:underline"
              >
                🔗 abrir edital na fonte
              </a>
            )}
          </div>
        </div>
        <EditalActions editalId={e.id} status={e.status} />
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {e.analise_resumo && (
            <section className="card p-6">
              <h2 className="font-bold mb-2">
                🧾 Análise{" "}
                <span className="text-xs text-muted font-normal">
                  (
                  {{
                    "claude": "Claude",
                    "claude-api": "Claude · API",
                    "claude-assinatura": "Claude · assinatura",
                    "heuristica": "heurística",
                  }[e.analise_modo ?? "heuristica"] ?? e.analise_modo}{" "}
                  · {fmtData(e.analisado_em)})
                </span>
              </h2>
              <p className="leading-relaxed">{e.analise_resumo}</p>
            </section>
          )}

          {eleg && (
            <section className="card p-6">
              <h2 className="font-bold mb-4">🎯 Filtro de Elegibilidade e Match</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(eleg).map(([k, v]) => (
                  <div
                    key={k}
                    className={`rounded-xl border p-4 ${
                      v.ok
                        ? "border-lime-400/30 bg-lime-400/5"
                        : "border-rose-400/30 bg-rose-400/5"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">
                      {v.ok ? "✅" : "❌"} {CRITERIO_LABEL[k] ?? k}
                    </div>
                    <div className="text-sm text-muted leading-relaxed">{v.nota}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-muted">
                Prazo viável (≥ 10 dias p/ escrita):{" "}
                {e.prazo_viavel === null ? "—" : e.prazo_viavel ? "✅ sim" : "❌ não"}
              </div>
            </section>
          )}

          {e.descricao && (
            <section className="card p-6">
              <h2 className="font-bold mb-2">📜 Descrição / Regulamento</h2>
              <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">
                {e.descricao}
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {briefing && (
            <section className="card p-6">
              <h2 className="font-bold mb-3">📋 Briefing de Escrita</h2>
              <div className="text-sm font-semibold text-fuchsia-300 mb-1">
                Documentação
              </div>
              <ul className="text-sm text-muted space-y-1 mb-4">
                {briefing.documentos.map((d, i) => (
                  <li key={i}>☐ {d}</li>
                ))}
              </ul>
              <div className="text-sm font-semibold text-fuchsia-300 mb-1">
                Requisitos da proposta
              </div>
              <ul className="text-sm text-muted space-y-1">
                {briefing.requisitos.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-6">
            <h2 className="font-bold mb-3">✍️ Propostas</h2>
            {propostas.length === 0 && (
              <p className="text-sm text-muted">
                Nenhuma proposta gerada. Use o botão “Gerar proposta” — o rascunho
                usa o banco de textos do pilar correspondente.
              </p>
            )}
            <div className="space-y-2">
              {propostas.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/propostas/${p.id}`}
                      className="text-sm font-medium hover:text-fuchsia-300 truncate block"
                    >
                      Proposta #{p.id}
                      {p.status === "gerando" && " · ✍️ escrevendo..."}
                      {p.status === "erro" && " · ❌ falhou"}
                    </Link>
                    <div className="text-xs text-muted">
                      {p.status === "gerando" ? "gerando" : p.modo} ·{" "}
                      {fmtData(p.criado_em)}
                    </div>
                  </div>
                  {p.status === "pronta" ? (
                    <a
                      href={`/api/propostas/${p.id}/docx`}
                      className="btn btn-ghost text-xs shrink-0"
                    >
                      ⬇ .docx
                    </a>
                  ) : (
                    <span className="text-xs text-muted shrink-0">
                      {p.status === "gerando" ? "⏳" : "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {e.motivo_descarte && (
            <section className="card p-6 border-rose-400/30">
              <h2 className="font-bold mb-2">🗑️ Motivo do descarte</h2>
              <p className="text-sm text-muted">{e.motivo_descarte}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
