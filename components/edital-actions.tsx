"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_META } from "./ui";

export function EditalActions({
  editalId,
  status,
}: {
  editalId: number;
  status: string;
}) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function analisar() {
    setOcupado("analisar");
    setMsg(null);
    try {
      const res = await fetch(`/api/editais/${editalId}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).erro);
      router.refresh();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : err}`);
    } finally {
      setOcupado(null);
    }
  }

  async function gerarProposta() {
    setOcupado("proposta");
    setMsg("✍️ Iniciando redação...");
    try {
      const res = await fetch(`/api/editais/${editalId}/proposta`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      // abre a proposta na hora — ela mostra "escrevendo..." e atualiza sozinha
      router.push(`/propostas/${data.id}`);
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : err}`);
      setOcupado(null);
    }
  }

  async function mudarStatus(novo: string) {
    setOcupado("status");
    try {
      await fetch(`/api/editais/${editalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novo }),
      });
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="btn btn-primary"
        onClick={analisar}
        disabled={ocupado !== null}
      >
        {ocupado === "analisar" ? "⏳ Analisando..." : "🎯 Analisar match"}
      </button>
      <button
        className="btn btn-primary"
        onClick={gerarProposta}
        disabled={ocupado !== null}
      >
        {ocupado === "proposta" ? "⏳ Escrevendo..." : "✍️ Gerar proposta"}
      </button>
      <select
        className="btn btn-ghost bg-transparent"
        value={status}
        disabled={ocupado !== null}
        onChange={(e) => mudarStatus(e.target.value)}
      >
        {Object.entries(STATUS_META).map(([k, v]) => (
          <option key={k} value={k} className="bg-surface text-ink">
            {v.emoji} {v.label}
          </option>
        ))}
      </select>
      {msg && <span className="text-sm text-muted w-full">{msg}</span>}
    </div>
  );
}
