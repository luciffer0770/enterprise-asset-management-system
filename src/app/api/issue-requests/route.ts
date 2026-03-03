import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  borrowerName: z.string().min(1),
  borrowerEmpId: z.string().min(1),
  reason: z.string().min(1),
  trolleyId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "checkout")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id ?? "";
  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const role = (session.user as { role?: string })?.role ?? "";

  const assetWhere =
    role === "ADMIN" || role === "LAB_INCHARGE"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, ...assetWhere },
  });

  if (!asset) {
    return NextResponse.json({ message: "Asset not found" }, { status: 404 });
  }

  if (asset.lifecycleState !== "IN_SERVICE") {
    return NextResponse.json(
      { message: "Asset is not available" },
      { status: 400 }
    );
  }

  const existing = await prisma.issueRequest.findFirst({
    where: { assetId: asset.id, status: "PENDING_APPROVAL" },
  });
  if (existing) {
    return NextResponse.json({ message: "A pending request already exists for this tool" }, { status: 409 });
  }

  const request = await prisma.issueRequest.create({
    data: {
      assetId: parsed.data.assetId,
      requesterId: userId,
      borrowerName: parsed.data.borrowerName.trim(),
      borrowerEmpId: parsed.data.borrowerEmpId.trim(),
      reason: parsed.data.reason.trim(),
      trolleyId: parsed.data.trolleyId ?? undefined,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "IssueRequest",
    entityId: request.id,
    action: "CREATE",
    diff: { assetTag: asset.assetTag, status: "PENDING_APPROVAL" },
  });

  return NextResponse.json({ ok: true, id: request.id });
}
