import Link from "next/link";
import { all, one, EditalRow } from "@/lib/db";
import { modoIaInfo } from "@/lib/analysis/analyzer";
import { ScanButton } from "@/components/scan-button";
import { EditalCard, fmtData, PrazoChip, STATUS_META } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await all<{ status: string; c: number }>(
    "SELECT status, COUNT(*)::int c FROM editais GROUP BY status"
  );
  const byStatus = Object.fromEntries(stats.map((s) => [s.status, s.c]));
  const total = stats.reduce((a, s) => a + s.c, 0);

  const proximosPrazos = await all<EditalRow>(
    `SELECT * FROM editais
     WHERE status NOT IN ('descartado','submetido')
       AND fim_inscricoes IS NOT NULL
       AND fim_inscricoes::date >= current_date
     ORDER BY fim_inscricoes::date ASC LIMIT 6`
  );

  const topMatches = await all<EditalRow>(
    `SELECT * FROM editais
     WHERE status NOT IN ('descartado','submetido') AND score IS NOT NULL
     ORDER BY score DESC LIMIT 6`
  );

  const ultimaVarredura = await one<{
    iniciada_em: string;
    origem: string;
    novos: number;
    total_encontrados: number;
  }>("SELECT * FROM varreduras ORDER BY id DESC LIMIT 1");

  const ia = await modoIaInfo();
  const telegram = Boolean(process.env.TELEGRAM_BOT_TOKEN);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Central de <span className="neon-text">Captação</span>
          </h1>
          <p className="text-muted mt-1">
            Monitoramento semanal de editais para GameJam+, Indie Hero e Plug and Plus.
          </p>
        </div>
        <ScanButton />
      </header>

      {/* status do sistema */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-extrabold">{total}</div>
          <div className="text-sm text-muted">editais no radar</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-fuchsia-300">
            {byStatus.match ?? 0}
          </div>
          <div className="text-sm text-muted">🎯 com match</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-violet-300">
            {(byStatus.escrita ?? 0) + (byStatus.submetido ?? 0)}
          </div>
          <div className="text-sm text-muted">✍️ em escrita / submetidos</div>
        </div>
        <div className="card p-5">
          <div className="text-sm space-y-1.5 leading-relaxed">
            <div>
              {ia.resolvido === "heuristica" ? "📐" : "🧠"} Análise: {ia.rotulo}
            </div>
            <div>{telegram ? "💬 Telegram: ativo" : "💬 Telegram: configurar token"}</div>
            <div className="text-muted">
              {ultimaVarredura
                ? `Última varredura: ${fmtData(ultimaVarredura.iniciada_em)} (${ultimaVarredura.origem})`
                : "Nenhuma varredura ainda — clique em Varrer agora"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* prazos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">⏰ Próximos prazos</h2>
            <Link href="/editais" className="text-sm text-muted hover:text-ink">
              ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {proximosPrazos.length === 0 && (
              <div className="card p-6 text-muted text-sm">
                Nada com prazo aberto. Rode uma varredura. 📡
              </div>
            )}
            {proximosPrazos.map((e) => (
              <Link
                key={e.id}
                href={`/editais/${e.id}`}
                className="card p-3.5 flex items-center gap-3 hover:card-glow transition-shadow"
              >
                <div className="w-24 shrink-0 text-center">
                  <div className="text-sm font-bold">{fmtData(e.fim_inscricoes)}</div>
                  <PrazoChip fim={e.fim_inscricoes} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.nome}</div>
                  <div className="text-xs text-muted truncate">
                    {e.orgao ?? "—"} · {STATUS_META[e.status]?.emoji}{" "}
                    {STATUS_META[e.status]?.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* top matches */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">🎯 Melhores matches</h2>
            <Link href="/pipeline" className="text-sm text-muted hover:text-ink">
              pipeline →
            </Link>
          </div>
          <div className="space-y-2">
            {topMatches.length === 0 && (
              <div className="card p-6 text-muted text-sm">
                Nenhum edital analisado ainda.
              </div>
            )}
            {topMatches.map((e) => (
              <EditalCard key={e.id} e={e} />
            ))}
          </div>
        </section>
      </div>

      {/* fluxo */}
      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">🔁 O fluxo de trabalho</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            ["📡", "Radar", "varredura semanal + sob demanda"],
            ["🔍", "Triagem", "leitura do regulamento"],
            ["🎯", "Match", "4 pilares + elegibilidade"],
            ["✍️", "Escrita", "proposta com banco de textos"],
            ["🚀", "Submetido", "acompanhamento"],
          ].map(([emoji, nome, desc], i, arr) => (
            <div key={nome} className="flex items-center gap-2">
              <div className="px-4 py-3 rounded-xl bg-surface-2 border border-border">
                <div className="font-bold">
                  {emoji} {nome}
                </div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
              {i < arr.length - 1 && <span className="text-muted">→</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
