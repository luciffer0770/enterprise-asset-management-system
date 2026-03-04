import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  borrowerEmail: z.string().email().optional(),
  dueDate: z.string().optional(),
  reason: z.string().optional(),
  requestedByName: z.string().optional(),
  requestedByEmployeeId: z.string().optional(),
  poolId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  if (!hasCapability(role, "checkout")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { assetId, borrowerEmail, dueDate, reason, requestedByName, requestedByEmployeeId, poolId } = parsed.data;
  const userId = (session.user as { id?: string }).id ?? session.user.email ?? "";
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const displayName = (session.user as { name?: string }).name ?? (session.user as { displayName?: string }).displayName ?? session.user.email ?? "";

  if (role === "EXTERNAL") {
    if (!reason?.trim()) return NextResponse.json({ message: "Reason is required for external requests" }, { status: 400 });
    if (!requestedByEmployeeId?.trim()) return NextResponse.json({ message: "Employee ID is required for external requests" }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { tenant: true },
  });

  if (!asset || asset.tenantId !== tenantId) {
    return NextResponse.json({ message: "Asset not found" }, { status: 404 });
  }

  if (asset.lifecycleState !== "IN_SERVICE") {
    return NextResponse.json(
      { message: "Asset is not available for checkout" },
      { status: 400 }
    );
  }

  let borrowerId = userId;
  if (borrowerEmail) {
    const borrower = await prisma.user.findFirst({
      where: { tenantId, email: borrowerEmail },
    });
    if (borrower) borrowerId = borrower.id;
  }

  const poolIdValid = poolId
    ? await prisma.inventoryPool.findFirst({ where: { id: poolId, tenantId } }).then((p) => !!p)
    : false;
  const assetUpdateData: { lifecycleState: string; status: string; poolId?: string | null } = {
    lifecycleState: "CHECKED_OUT",
    status: "CHECKED_OUT",
  };
  if (poolIdValid) assetUpdateData.poolId = poolId;

  const [checkout] = await prisma.$transaction([
    prisma.checkout.create({
      data: {
        assetId,
        borrowerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        conditionOut: "GOOD",
        reason: reason?.trim() || null,
        requestedByName: requestedByName?.trim() || (role === "EXTERNAL" ? displayName : null),
        requestedByEmployeeId: requestedByEmployeeId?.trim() || null,
        poolId: poolIdValid ? poolId : null,
      },
    }),
    prisma.asset.update({
      where: { id: assetId },
      data: assetUpdateData,
    }),
  ]);

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Checkout",
    entityId: assetId,
    action: "CHECKOUT",
    diff: { assetTag: asset.assetTag, borrowerId, dueDate },
  });

  // Create a simple work-order ticket so checkout events appear in the ticketing board
  await prisma.workOrder.create({
    data: {
      assetId: asset.id,
      type: "checkout",
      priority: "NORMAL",
      status: "OPEN",
      title: `Checkout: ${asset.assetTag}`,
      description: `Checkout ticket created from checkout ${checkout.id}`,
    },
  });

  return NextResponse.json({ ok: true });
}
