import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Set NEXTAUTH_URL from request so auth works behind proxies (Codespaces, Vercel, etc.)
function setAuthUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
  const url = `${proto}://${host}`;
  process.env.NEXTAUTH_URL = url;
}

async function handler(req: NextRequest, ctx: unknown) {
  setAuthUrl(req);
  // Force secure cookies when accessed via HTTPS (required for Codespaces/proxy)
  const url = process.env.NEXTAUTH_URL || "";
  const opts = url.startsWith("https://")
    ? { ...authOptions, useSecureCookies: true }
    : authOptions;
  return NextAuth(req, ctx as { params: Promise<{ nextauth: string[] }> }, opts);
}

export { handler as GET, handler as POST };
