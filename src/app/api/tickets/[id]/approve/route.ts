import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
  assetState: z.enum(["IN_SERVICE", "UNDER_MAINTENANCE", "QUARANTINED"]).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "tickets:approve")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { decision, notes, assetState } = parsed.data;
  const userId = (session.user as { id?: string }).id ?? "";
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const ticket = await prisma.returnTicket.findFirst({
    where: { id, checkout: { asset: { tenantId } } },
    include: {
      checkout: { include: { asset: true } },
    },
  });

  if (!ticket || ticket.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ message: "Ticket not found or already processed" }, { status: 404 });
  }

  const targetState = decision === "APPROVE"
    ? (assetState ?? "IN_SERVICE")
    : "CHECKED_OUT"; // Reject: keep checked out, ticket REJECTED

  await prisma.$transaction(async (tx) => {
    await tx.returnTicket.update({
      where: { id },
      data: {
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        approverId: userId,
        decisionNote: notes,
        decidedAt: new Date(),
        closedAt: decision === "APPROVE" ? new Date() : null,
      },
    });

    if (decision === "APPROVE") {
      await tx.checkout.update({
        where: { id: ticket.checkoutId },
        data: { returnedAt: new Date(), conditionIn: "GOOD" },
      });
      await tx.asset.update({
        where: { id: ticket.checkout.assetId },
        data: {
          lifecycleState: targetState,
          status: targetState,
        },
      });
    }

    await tx.ticketApproval.create({
      data: {
        ticketId: id,
        approverId: userId,
        decision,
        notes: notes ?? "",
      },
    });
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "ReturnTicket",
    entityId: id,
    action: decision === "APPROVE" ? "TICKET_APPROVED" : "TICKET_REJECTED",
    diff: { decision, assetTag: ticket.checkout.asset.assetTag },
  });

  return NextResponse.json({ ok: true });
}
