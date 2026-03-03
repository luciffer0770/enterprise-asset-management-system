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

  // Create ReturnTicket (requires approval for Admin/LAB_INCHARGE)
  const canApprove = hasCapability((session.user as { role?: string }).role ?? "", "tickets:approve");
  if (canApprove) {
    // Approver: auto-approve and complete return
    await prisma.$transaction([
      prisma.checkout.update({
        where: { id: checkout.id },
        data: { returnedAt: new Date(), conditionIn: body.conditionIn ?? "GOOD" },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
      }),
    ]);
  } else {
    // Non-approver: create ticket, set RETURN_PENDING
    const ticket = await prisma.returnTicket.create({
      data: {
        checkoutId: checkout.id,
        status: "PENDING_APPROVAL",
        raisedById: userId,
      },
    });
    await prisma.asset.update({
      where: { id: assetId },
      data: { lifecycleState: "RETURN_PENDING", status: "RETURN_PENDING" },
    });
    await logAudit({
      tenantId,
      actorUserId: userId,
      entityType: "ReturnTicket",
      entityId: ticket.id,
      action: "CREATE",
      diff: { assetTag: checkout.asset.assetTag, status: "PENDING_APPROVAL" },
    });
    return NextResponse.json({ ok: true, ticketId: ticket.id, needsApproval: true });
  }

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
