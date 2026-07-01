"use client";

import { useEffect, useState } from "react";

interface FonteRss {
  id?: number;
  nome: string;
  url: string;
  ativa: number | boolean;
}

interface Settings {
  keywords: string[];
  cronSemanal: string | null;
  prazoMinimoDias: number;
  fontesRss: FonteRss[];
  telegramAtivo: boolean;
  telegramChats: number;
  claudeAtivo: boolean;
  modoIa: "auto" | "assinatura" | "api" | "heuristica";
  modoIaResolvido: "assinatura" | "api" | "heuristica";
  modoIaRotulo: string;
  cliDisponivel: boolean;
  cliVersao: string | null;
  apiDisponivel: boolean;
  iaMaxPorVarredura: number;
}

export default function ConfigPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [keywords, setKeywords] = useState("");
  const [cron, setCron] = useState("");
  const [fontes, setFontes] = useState<FonteRss[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [codaMsg, setCodaMsg] = useState<string | null>(null);
  const [codaSync, setCodaSync] = useState(false);
  const [modoIa, setModoIa] = useState<Settings["modoIa"]>("auto");
  const [iaMax, setIaMax] = useState(10);
  const [reMsg, setReMsg] = useState<string | null>(null);
  const [reRodando, setReRodando] = useState(false);

  interface BatchStatus {
    rodando: boolean;
    total: number;
    feitos: number;
    erros: number;
    ultimoEdital: string | null;
    finalizadoEm: string | null;
  }
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setS(data);
        setKeywords(data.keywords.join(", "));
        setCron(data.cronSemanal ?? "0 9 * * 1");
        setFontes(data.fontesRss);
        setModoIa(data.modoIa ?? "auto");
        setIaMax(data.iaMaxPorVarredura ?? 10);
      });
    // carrega o status inicial do lote
    fetch("/api/reanalyze/batch")
      .then((r) => r.json())
      .then(setBatch)
      .catch(() => {});
  }, []);

  // enquanto o lote roda, pega o progresso a cada 3s
  useEffect(() => {
    if (!batch?.rodando) return;
    const t = setInterval(() => {
      fetch("/api/reanalyze/batch")
        .then((r) => r.json())
        .then(setBatch)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [batch?.rodando]);

  async function iniciarBatch() {
    setBatchMsg(null);
    try {
      const res = await fetch("/api/reanalyze/batch", { method: "POST", body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setBatch(data.status);
    } catch (err) {
      setBatchMsg(`❌ ${err instanceof Error ? err.message : err}`);
    }
  }

  async function cancelarBatch() {
    await fetch("/api/reanalyze/batch", { method: "DELETE" });
    setBatchMsg("Cancelado — o que já foi analisado fica salvo.");
  }

  async function reanalisar() {
    setReRodando(true);
    setReMsg("🧠 Reanalisando os melhores editais com IA... (pode levar alguns minutos)");
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limite: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setReMsg(
        `✅ ${data.processados} edital(is) reanalisado(s) via ${data.modo === "assinatura" ? "assinatura" : "API"}.`
      );
    } catch (err) {
      setReMsg(`❌ ${err instanceof Error ? err.message : err}`);
    } finally {
      setReRodando(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          cronSemanal: cron,
          fontesRss: fontes.filter((f) => f.url),
          modoIa,
          iaMaxPorVarredura: iaMax,
        }),
      });
      if (!res.ok) throw new Error("falha ao salvar");
      setMsg("✅ Salvo!");
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : err}`);
    } finally {
      setSalvando(false);
    }
  }

  async function sincronizarCoda() {
    setCodaSync(true);
    setCodaMsg(null);
    try {
      const res = await fetch("/api/coda-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setCodaMsg(
        `✅ Importado do Coda: ${data.historico} registro(s) de histórico, ${data.editais} edital(is)/plataforma(s).`
      );
    } catch (err) {
      setCodaMsg(`❌ ${err instanceof Error ? err.message : err}`);
    } finally {
      setCodaSync(false);
    }
  }

  if (!s) return <div className="text-muted">Carregando…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">⚙️ Configurações</h1>
        <p className="text-muted mt-1">
          Fontes, keywords e agenda do monitoramento semanal.
        </p>
      </header>

      <section className="card p-6 space-y-3">
        <h2 className="font-bold">🧠 Modo de IA</h2>
        <p className="text-sm text-muted">
          Como o app analisa editais e escreve propostas. Modo atual em uso:{" "}
          <b className="text-fuchsia-300">{s.modoIaRotulo}</b>
        </p>
        <div className="space-y-2 text-sm">
          {(
            [
              {
                valor: "auto",
                titulo: "🪄 Automático (recomendado)",
                desc: "Usa assinatura se o Claude Code estiver logado; senão API; senão heurística.",
                disponivel: true,
              },
              {
                valor: "assinatura",
                titulo: "🎟️ Assinatura Claude (Pro/Max)",
                desc: s.cliDisponivel
                  ? `CLI detectado (${s.cliVersao ?? "ok"}) — zero crédito de API. A partir de 15/06/2026 consome o crédito mensal dedicado do plano (US$100–200 no Max).`
                  : "Indisponível: instale e logue o Claude Code (`claude`) nesta máquina.",
                disponivel: s.cliDisponivel,
              },
              {
                valor: "api",
                titulo: "🔌 API Anthropic",
                desc: s.apiDisponivel
                  ? "Chave configurada — cobra créditos de API (indicado p/ serverless/produção compartilhada)."
                  : "Indisponível: defina ANTHROPIC_API_KEY no .env.local.",
                disponivel: s.apiDisponivel,
              },
              {
                valor: "heuristica",
                titulo: "📐 Heurística local",
                desc: "Triagem por keywords e regras — grátis, sempre disponível, menos precisa.",
                disponivel: true,
              },
            ] as const
          ).map((op) => (
            <label
              key={op.valor}
              className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                modoIa === op.valor
                  ? "border-fuchsia-400/60 bg-fuchsia-400/5"
                  : "border-border hover:border-neon"
              } ${op.disponivel ? "" : "opacity-60"}`}
            >
              <input
                type="radio"
                name="modoIa"
                value={op.valor}
                checked={modoIa === op.valor}
                onChange={() => setModoIa(op.valor)}
                className="mt-1 accent-fuchsia-500"
              />
              <span>
                <span className="font-semibold">{op.titulo}</span>
                <span className="block text-muted text-xs mt-0.5 leading-relaxed">
                  {op.desc}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
          <label className="flex items-center gap-2">
            Máx. de análises com IA por varredura:
            <input
              type="number"
              min={0}
              max={100}
              value={iaMax}
              onChange={(e) => setIaMax(parseInt(e.target.value, 10) || 0)}
              className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1 outline-none focus:border-neon"
            />
          </label>
          <span className="text-xs text-muted">
            (a heurística triagem todos de graça; a IA aprofunda só os top-N)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button className="btn btn-primary" onClick={reanalisar} disabled={reRodando}>
            {reRodando ? "⏳ Reanalisando..." : "🧠 Reanalisar top 10 com IA"}
          </button>
          {reMsg && <span className="text-sm text-muted">{reMsg}</span>}
        </div>

        {/* Reanálise de TODO o pipeline com barra de progresso */}
        <div className="rounded-xl border border-border bg-surface-2 p-4 mt-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">
                🎯 Reanalisar o pipeline inteiro com IA
              </div>
              <div className="text-xs text-muted mt-0.5 max-w-xl leading-relaxed">
                Substitui a triagem heurística (que superestima) pela análise do
                Claude em todos os editais com prazo aberto — o topo passa a
                refletir elegibilidade real. Roda em background; pode fechar a
                página.
              </div>
            </div>
            {batch?.rodando ? (
              <button className="btn btn-ghost" onClick={cancelarBatch}>
                ⏹ Cancelar
              </button>
            ) : (
              <button className="btn btn-primary" onClick={iniciarBatch}>
                🚀 Reanalisar tudo
              </button>
            )}
          </div>

          {batch && (batch.rodando || batch.total > 0) && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500"
                  style={{
                    width: `${batch.total ? Math.round((batch.feitos / batch.total) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {batch.rodando ? "⏳ analisando" : "✅ concluído"}: {batch.feitos}/
                  {batch.total}
                  {batch.erros > 0 ? ` · ${batch.erros} erro(s)` : ""}
                </span>
                {batch.ultimoEdital && (
                  <span className="truncate max-w-[55%]" title={batch.ultimoEdital}>
                    {batch.ultimoEdital}
                  </span>
                )}
              </div>
            </div>
          )}
          {batchMsg && <div className="text-sm text-muted">{batchMsg}</div>}
        </div>
      </section>

      <section className="card p-6 space-y-2">
        <h2 className="font-bold">🔌 Integrações</h2>
        <div className="text-sm space-y-1.5">
          <div>
            {s.telegramAtivo ? "✅" : "⬜"} <b>Telegram</b> —{" "}
            {s.telegramAtivo
              ? `bot ativo · ${s.telegramChats} chat(s) registrados para alertas`
              : "defina TELEGRAM_BOT_TOKEN no .env.local (crie o bot com o @BotFather)"}
          </div>
          <div>
            ✅ <b>Coda</b> — snapshot do doc <i>GJ+ Editais</i> já exportado
            (banco de referências, histórico de submissões 2025/2026 e
            plataformas de patrocínio). Clique para importar/atualizar:
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button className="btn btn-primary" onClick={sincronizarCoda} disabled={codaSync}>
            {codaSync ? "Importando..." : "🔄 Sincronizar Coda"}
          </button>
          {codaMsg && <span className="text-sm text-muted">{codaMsg}</span>}
        </div>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="font-bold">🔍 Keywords da busca ativa</h2>
        <p className="text-sm text-muted">
          Cada keyword vira uma busca na Central de Editais da Prosas (separar
          por vírgula).
        </p>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-neon"
        />
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="font-bold">🗓️ Agenda do monitoramento semanal</h2>
        <p className="text-sm text-muted">
          Expressão cron — padrão <code>0 9 * * 1</code> (toda segunda às 9h).
          Os alertas vão para os chats do Telegram registrados via /start.
        </p>
        <input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          className="w-64 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-neon"
        />
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="font-bold">📰 Fontes RSS adicionais</h2>
        <p className="text-sm text-muted">
          Qualquer feed RSS/Atom de editais entra na varredura (newsletters,
          diários oficiais com feed, blogs de fomento...).
        </p>
        {fontes.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              placeholder="nome"
              value={f.nome}
              onChange={(e) =>
                setFontes(fontes.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))
              }
              className="w-44 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-neon"
            />
            <input
              placeholder="https://exemplo.com/feed"
              value={f.url}
              onChange={(e) =>
                setFontes(fontes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
              }
              className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-neon"
            />
            <button
              className="btn btn-ghost"
              onClick={() => setFontes(fontes.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn btn-ghost"
          onClick={() => setFontes([...fontes, { nome: "", url: "", ativa: 1 }])}
        >
          + adicionar fonte
        </button>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "💾 Salvar configurações"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
