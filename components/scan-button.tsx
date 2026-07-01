"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanButton() {
  const [rodando, setRodando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function varrer() {
    setRodando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha na varredura");
      setMsg(
        `✅ ${data.novos} novo(s) de ${data.totalEncontrados} encontrado(s)${
          data.erros?.length ? ` · ⚠️ ${data.erros.length} erro(s)` : ""
        }`
      );
      router.refresh();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : err}`);
    } finally {
      setRodando(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn btn-primary" onClick={varrer} disabled={rodando}>
        {rodando ? (
          <>
            <span className="animate-spin">⏳</span> Varrendo fontes...
          </>
        ) : (
          <>📡 Varrer agora</>
        )}
      </button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
