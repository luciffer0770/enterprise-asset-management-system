import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  decision: z.enum(["APPROVE_OK", "APPROVE_WITH_ISSUE", "REJECT"]),
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
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  if (!hasCapability(role, "tickets:approve")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = (session.user as { id?: string }).id ?? "";
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { decision, notes, assetState } = parsed.data;

  const ticket = await prisma.returnTicket.findUnique({
    where: { id, tenantId },
    include: {
      checkout: true,
      asset: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
  }
  if (ticket.status !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { message: "Ticket is not pending approval" },
      { status: 400 }
    );
  }

  const finalAssetState =
    decision === "REJECT"
      ? "CHECKED_OUT"
      : decision === "APPROVE_WITH_ISSUE"
        ? assetState ?? "UNDER_MAINTENANCE"
        : "IN_SERVICE";

  await prisma.$transaction([
    prisma.ticketApproval.create({
      data: {
        returnTicketId: ticket.id,
        approverId: userId,
        decision,
        notes: notes ?? null,
      },
    }),
    prisma.returnTicket.update({
      where: { id: ticket.id },
      data: {
        status: "ARCHIVED",
        resolutionNotes: notes ?? null,
        resolvedAt: new Date(),
        approverId: userId,
      },
    }),
    ...(decision !== "REJECT"
      ? [
          prisma.checkout.update({
            where: { id: ticket.checkoutId },
            data: { returnedAt: new Date(), conditionIn: "GOOD" },
          }),
          prisma.asset.update({
            where: { id: ticket.assetId },
            data: {
              lifecycleState: finalAssetState,
              status: finalAssetState,
            },
          }),
        ]
      : []),
  ]);

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "ReturnTicket",
    entityId: ticket.id,
    action: decision === "REJECT" ? "TICKET_REJECTED" : "TICKET_APPROVED",
    diff: {
      decision,
      assetTag: ticket.asset.assetTag,
      assetState: finalAssetState,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
