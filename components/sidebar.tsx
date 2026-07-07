"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📡" },
  { href: "/editais", label: "Editais", icon: "📑" },
  { href: "/pipeline", label: "Pipeline", icon: "🗂️" },
  { href: "/propostas", label: "Escritos", icon: "✍️" },
  { href: "/fontes", label: "Fontes", icon: "🌐" },
  { href: "/banco-textos", label: "Banco de Textos", icon: "📚" },
  { href: "/empresas", label: "Empresas & CNPJs", icon: "🏢" },
  { href: "/config", label: "Configurações", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-border px-4 py-6 flex flex-col gap-1 sticky top-0 h-screen">
      <div className="px-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center text-xl radar-ping">
            🎮
          </div>
          <div>
            <div className="font-extrabold text-lg leading-tight neon-text">
              Radar de Editais
            </div>
            <div className="text-[11px] text-muted tracking-wider uppercase">
              GameJam+ · Indie Hero
            </div>
          </div>
        </div>
      </div>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link ${
            pathname === l.href ||
            (l.href !== "/" && pathname.startsWith(l.href))
              ? "active"
              : ""
          }`}
        >
          <span>{l.icon}</span>
          {l.label}
        </Link>
      ))}
      <div className="mt-auto px-3 text-[11px] text-muted leading-relaxed">
        Monitoramento <b>semanal</b> + busca sob demanda via Telegram.
      </div>
    </aside>
  );
}
