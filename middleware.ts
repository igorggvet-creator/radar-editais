import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tokenEsperado, COOKIE_AUTH } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const token = await tokenEsperado();
  if (!token) return NextResponse.next(); // APP_PASSWORD não definido → aberto

  const { pathname } = req.nextUrl;
  // endpoints chamados por máquinas (cron da Vercel, webhook do Telegram) têm
  // seus próprios segredos — não passam pelo gate de cookie.
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/telegram")
  ) {
    return NextResponse.next();
  }

  if (req.cookies.get(COOKIE_AUTH)?.value === token) {
    return NextResponse.next();
  }

  const dest = new URL("/login", req.url);
  dest.searchParams.set("from", pathname);
  return NextResponse.redirect(dest);
}

export const config = {
  matcher: [
    // tudo exceto assets estáticos do Next e arquivos com extensão
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
