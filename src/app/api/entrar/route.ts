import { NextResponse } from "next/server";
import { COOKIE, passwordToken } from "@/lib/gate";

export async function POST(req: Request) {
  const form = await req.formData();
  const typed = String(form.get("senha") ?? "");
  const password = process.env.SITE_PASSWORD;
  const base = new URL(req.url);
  if (!password || typed !== password) {
    return NextResponse.redirect(new URL("/entrar?erro=1", base), 303);
  }
  const res = NextResponse.redirect(new URL("/", base), 303);
  res.cookies.set(COOKIE, await passwordToken(password), {
    httpOnly: true,
    secure: base.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
