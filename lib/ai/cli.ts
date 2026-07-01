// Caminho "assinatura": executa prompts via Claude Code CLI (`claude -p`),
// autenticado pelo login da assinatura (Pro/Max) — sem ANTHROPIC_API_KEY.
// A partir de 15/06/2026 esse uso consome o crédito mensal dedicado do plano
// (Agent SDK credit); antes disso, roda dentro do uso normal da assinatura.
//
// Requisito: o CLI `claude` instalado e logado na máquina que hospeda o app.

import { spawn } from "node:child_process";

let cliCache: { ok: boolean; versao: string | null; em: number } | null = null;

/** Verifica (com cache de 5 min) se o CLI `claude` está disponível no host. */
export async function cliDisponivel(): Promise<{ ok: boolean; versao: string | null }> {
  if (cliCache && Date.now() - cliCache.em < 5 * 60_000) {
    return { ok: cliCache.ok, versao: cliCache.versao };
  }
  try {
    const out = await new Promise<string>((resolve, reject) => {
      const child = spawn("claude", ["--version"], {
        shell: true,
        windowsHide: true,
      });
      let stdout = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("timeout"));
      }, 15_000);
      child.stdout.on("data", (d) => (stdout += d));
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`exit ${code}`));
      });
    });
    cliCache = { ok: true, versao: out.split("\n")[0] ?? null, em: Date.now() };
  } catch {
    cliCache = { ok: false, versao: null, em: Date.now() };
  }
  return { ok: cliCache.ok, versao: cliCache.versao };
}

/**
 * Envia um prompt ao Claude via CLI (modo print, sem ferramentas) e retorna
 * o texto da resposta. O prompt vai por stdin (sem limite de linha de comando).
 */
export function perguntarClaudeCli(
  prompt: string,
  opts?: { timeoutMs?: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ["-p"];
    const modelo = process.env.CLAUDE_CLI_MODEL;
    if (modelo) args.push("--model", modelo);

    const child = spawn("claude", args, { shell: true, windowsHide: true });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude CLI: timeout após ${opts?.timeoutMs ?? 180_000}ms`));
    }, opts?.timeoutMs ?? 180_000);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) resolve(out.trim());
      else reject(new Error(`claude CLI exit ${code}: ${err.slice(0, 400)}`));
    });

    child.stdin.write(prompt, "utf8");
    child.stdin.end();
  });
}

/** Extrai o primeiro objeto JSON de uma resposta (tolera cercas ```json). */
export function extrairJson<T>(texto: string): T {
  const semFences = texto.replace(/```(?:json)?/gi, "").trim();
  const ini = semFences.indexOf("{");
  const fim = semFences.lastIndexOf("}");
  if (ini === -1 || fim === -1 || fim <= ini) {
    throw new Error("Resposta do CLI não contém JSON");
  }
  return JSON.parse(semFences.slice(ini, fim + 1)) as T;
}
