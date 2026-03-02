import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "checkout")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const assetId = body?.assetId;
  if (!assetId) {
    return NextResponse.json({ message: "assetId required" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const userId = (session.user as { id?: string }).id ?? "";

  const checkout = await prisma.checkout.findFirst({
    where: {
      assetId,
      returnedAt: null,
      asset: { tenantId },
    },
    include: { asset: true },
  });

  if (!checkout) {
    return NextResponse.json({ message: "No active checkout found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.checkout.update({
      where: { id: checkout.id },
      data: { returnedAt: new Date(), conditionIn: "GOOD" },
    }),
    prisma.asset.update({
      where: { id: assetId },
      data: { lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
    }),
  ]);

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Checkout",
    entityId: checkout.id,
    action: "RETURN",
    diff: { assetTag: checkout.asset.assetTag },
  });

  return NextResponse.json({ ok: true });
}
