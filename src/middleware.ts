import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Set NEXTAUTH_URL from request headers so auth works behind proxies
 * (GitHub Codespaces, Vercel, etc.)
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (req.nextUrl.protocol === "https:" ? "https" : "http");
  const url = `${proto}://${host}`;
  if (url) {
    process.env.NEXTAUTH_URL = url;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
