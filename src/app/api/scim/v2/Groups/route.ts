// SCIM Groups endpoint stub - RFC 7644 style
// Protected by Admin-only token auth (implementation left as stub)

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { detail: "Missing or invalid Authorization" },
      { status: 401 }
    );
  }
  return NextResponse.json({
    Resources: [],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  });
}
