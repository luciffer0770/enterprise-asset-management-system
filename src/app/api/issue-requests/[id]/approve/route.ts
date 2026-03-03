import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
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

  const userId = (session.user as { id?: string })?.id ?? "";
  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";

  const issueRequest = await prisma.issueRequest.findFirst({
    where: { id, asset: { tenantId } },
    include: { asset: true },
  });

  if (!issueRequest || issueRequest.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ message: "Request not found or already processed" }, { status: 404 });
  }

  if (parsed.data.decision === "REJECT") {
    await prisma.issueRequest.update({
      where: { id },
      data: { status: "REJECTED", approverId: userId, decidedAt: new Date() },
    });
    await logAudit({
      tenantId,
      actorUserId: userId,
      entityType: "IssueRequest",
      entityId: id,
      action: "REJECT",
      diff: { assetTag: issueRequest.asset.assetTag },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction([
    prisma.checkout.create({
      data: {
        assetId: issueRequest.assetId,
        borrowerId: issueRequest.requesterId,
        borrowerName: issueRequest.borrowerName,
        borrowerEmpId: issueRequest.borrowerEmpId,
        reason: issueRequest.reason,
        trolleyId: issueRequest.trolleyId ?? undefined,
        dueDate: issueRequest.dueDate ?? null,
      },
    }),
    prisma.asset.update({
      where: { id: issueRequest.assetId },
      data: { lifecycleState: "CHECKED_OUT", status: "CHECKED_OUT" },
    }),
    prisma.issueRequest.update({
      where: { id },
      data: { status: "APPROVED", approverId: userId, decidedAt: new Date() },
    }),
  ]);

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "IssueRequest",
    entityId: id,
    action: "APPROVE",
    diff: { assetTag: issueRequest.asset.assetTag },
  });

  return NextResponse.json({ ok: true });
}
