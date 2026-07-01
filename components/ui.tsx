import Link from "next/link";
import { fonteDeEdital } from "@/lib/fontes-catalogo";

export const STATUS_META: Record<
  string,
  { label: string; cor: string; emoji: string }
> = {
  radar: { label: "Radar", cor: "border-cyan-400/50 text-cyan-300", emoji: "📡" },
  triagem: { label: "Triagem", cor: "border-amber-400/50 text-amber-300", emoji: "🔍" },
  match: { label: "Match", cor: "border-fuchsia-400/50 text-fuchsia-300", emoji: "🎯" },
  escrita: { label: "Escrita", cor: "border-violet-400/50 text-violet-300", emoji: "✍️" },
  submetido: { label: "Submetido", cor: "border-lime-400/50 text-lime-300", emoji: "🚀" },
  descartado: { label: "Descartado", cor: "border-zinc-500/50 text-zinc-400", emoji: "🗑️" },
};

export const PILAR_META: Record<string, { label: string; emoji: string }> = {
  educacao: { label: "Educação", emoji: "🎓" },
  internacionalizacao: { label: "Internacionalização", emoji: "🌍" },
  inovacao: { label: "Inovação", emoji: "🚀" },
  eventos: { label: "Eventos", emoji: "🎪" },
};

export const EMPRESA_META: Record<string, string> = {
  "startup-grid": "GameJam+ (Startup Grid)",
  "acelera-indie": "Indie Hero",
  "plug-and-plus": "Plug and Plus",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.radar;
  return (
    <span className={`badge ${meta.cor}`}>
      {meta.emoji} {meta.label}
    </span>
  );
}

export function ScoreRing({ score }: { score: number | null }) {
  const s = score ?? 0;
  const cor = s >= 60 ? "#a3e635" : s >= 30 ? "#fbbf24" : "#fb7185";
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-12 h-12 shrink-0" title={`Score ${s}/100`}>
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#2c2050" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(s / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {score ?? "—"}
      </span>
    </div>
  );
}

export function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function diasRestantes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86_400_000);
}

export function PrazoChip({ fim }: { fim: string | null }) {
  const dias = diasRestantes(fim);
  if (dias === null) return <span className="text-muted text-xs">sem prazo</span>;
  const cor =
    dias < 0 ? "text-zinc-500" : dias <= 5 ? "text-rose-400" : dias <= 12 ? "text-amber-300" : "text-lime-300";
  return (
    <span className={`text-xs font-semibold ${cor}`}>
      {dias < 0 ? "encerrado" : dias === 0 ? "último dia!" : `${dias}d restantes`}
    </span>
  );
}

export function EditalCard({
  e,
}: {
  e: {
    id: number;
    nome: string;
    orgao: string | null;
    score: number | null;
    status: string;
    fim_inscricoes: string | null;
    pilar_slug: string | null;
    empresa_slug: string | null;
    fonte?: string | null;
  };
}) {
  const pilar = e.pilar_slug ? PILAR_META[e.pilar_slug] : null;
  const fonte = fonteDeEdital(e.fonte ?? null);
  return (
    <Link
      href={`/editais/${e.id}`}
      className="card p-4 flex items-center gap-4 hover:card-glow transition-shadow"
    >
      <ScoreRing score={e.score} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{e.nome}</div>
        <div className="text-sm text-muted truncate">
          {e.orgao ?? "órgão não informado"}
          {pilar ? ` · ${pilar.emoji} ${pilar.label}` : ""}
          {e.empresa_slug ? ` · ${EMPRESA_META[e.empresa_slug] ?? e.empresa_slug}` : ""}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={e.status} />
        <div className="flex items-center gap-2 text-xs text-muted">
          <span title="Onde foi encontrado">
            {fonte.emoji} {fonte.nome}
          </span>
          <span>·</span>
          <PrazoChip fim={e.fim_inscricoes} />
        </div>
      </div>
    </Link>
  );
}
