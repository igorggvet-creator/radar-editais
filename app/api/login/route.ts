import { NextRequest, NextResponse } from "next/server";
import { tokenEsperado, sha256hex, COOKIE_AUTH } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { senha } = await req.json().catch(() => ({ senha: "" }));
  const esperado = await tokenEsperado();
  if (!esperado) return NextResponse.json({ ok: true }); // auth desativado

  const recebido = await sha256hex("radar-editais:" + (senha ?? ""));
  if (recebido !== esperado) {
    return NextResponse.json({ erro: "Senha incorreta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_AUTH, esperado, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
