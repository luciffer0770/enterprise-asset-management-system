import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Set NEXTAUTH_URL from request so auth works with any host (port forward, cloud proxy, etc.)
function setAuthUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
  process.env.NEXTAUTH_URL = `${proto}://${host}`;
}

async function handler(req: NextRequest, ctx: unknown) {
  setAuthUrl(req);
  return NextAuth(req, ctx as { params: Promise<{ nextauth: string[] }> }, authOptions);
}

export { handler as GET, handler as POST };
