import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Only Admin can close tickets" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const closeReason = (body.reason as string)?.trim() || "Closed by admin";

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const checkout = await prisma.checkout.findFirst({
    where: { id, asset: { tenantId } },
    include: { asset: true },
  });

  if (!checkout) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (checkout.returnedAt) {
    return NextResponse.json({ message: "Already returned" }, { status: 400 });
  }

  const notes = checkout.notes ? `${checkout.notes}\n[Admin closed]: ${closeReason}` : `[Admin closed]: ${closeReason}`;

  await prisma.$transaction([
    prisma.checkout.update({
      where: { id },
      data: { returnedAt: new Date(), notes },
    }),
    prisma.asset.update({
      where: { id: checkout.assetId },
      data: { lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
    }),
  ]);

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Checkout",
    entityId: id,
    action: "CLOSE",
    diff: { reason: closeReason, assetTag: checkout.asset.assetTag },
  });

  return NextResponse.json({ ok: true });
}
