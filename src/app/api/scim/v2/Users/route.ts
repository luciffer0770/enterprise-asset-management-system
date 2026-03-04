// SCIM Users endpoint stub - RFC 7644 style
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
  // TODO: Validate admin token, return SCIM User list
  return NextResponse.json({
    Resources: [],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { detail: "Missing or invalid Authorization" },
      { status: 401 }
    );
  }
  // TODO: Validate admin token, create user from SCIM User schema
  return NextResponse.json(
    { detail: "SCIM provisioning stub - configure CLIENT_ID/CLIENT_SECRET" },
    { status: 501 }
  );
}
