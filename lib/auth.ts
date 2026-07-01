// Auth simples por senha compartilhada. O gate só ativa se APP_PASSWORD
// estiver definido (em produção/Vercel). Sem a env, o app fica aberto (dev).
// Funciona tanto no Edge (middleware) quanto no Node (rotas) — usa Web Crypto.

export const COOKIE_AUTH = "radar_auth";

export function authAtivo(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

export async function sha256hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Token determinístico derivado da senha — é o valor guardado no cookie.
export async function tokenEsperado(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  return sha256hex("radar-editais:" + pw);
}
