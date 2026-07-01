"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) throw new Error((await res.json()).erro ?? "falha");
      router.replace(params.get("from") || "/");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="card card-glow p-8 w-full max-w-sm space-y-4">
      <div className="text-center">
        <div className="text-4xl">🎮</div>
        <h1 className="text-xl font-extrabold neon-text mt-2">Radar de Editais</h1>
        <p className="text-sm text-muted">GameJam+ · Indie Hero</p>
      </div>
      <input
        type="password"
        autoFocus
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="senha de acesso"
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-neon"
      />
      <button type="submit" className="btn btn-primary w-full justify-center" disabled={entrando}>
        {entrando ? "Entrando..." : "Entrar"}
      </button>
      {erro && <div className="text-sm text-rose-400 text-center">❌ {erro}</div>}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
