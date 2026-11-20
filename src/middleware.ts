import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, passwordToken } from "@/lib/gate";

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();
  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && cookie === (await passwordToken(password))) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return new NextResponse("Entre com a senha da família", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|entrar|api/entrar).*)"],
};
