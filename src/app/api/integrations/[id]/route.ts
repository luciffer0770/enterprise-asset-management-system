import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !hasCapability((session.user as { role?: string }).role ?? "", "integrations")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const enabled = body?.enabled;

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ message: "enabled required" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const config = await prisma.integrationConfig.findFirst({
    where: { id, tenantId },
  });

  if (!config) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.integrationConfig.update({
    where: { id },
    data: { enabled, status: "PENDING" },
  });

  return NextResponse.json({ ok: true });
}
