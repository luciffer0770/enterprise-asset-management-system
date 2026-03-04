import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(["corrective", "preventive"]),
  priority: z.string(),
  assignedToId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "workorders:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { assetId, title, description, type, priority, assignedToId } = parsed.data;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const assetWhere =
    (session.user as { role?: string }).role === "ADMIN"
      ? { id: assetId, tenantId }
      : { id: assetId, tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const asset = await prisma.asset.findFirst({
    where: assetWhere,
  });

  if (!asset) {
    return NextResponse.json({ message: "Asset not found" }, { status: 404 });
  }

  const wo = await prisma.workOrder.create({
    data: {
      assetId,
      title,
      description,
      type,
      priority,
      assignedToId,
    },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      lifecycleState: "UNDER_MAINTENANCE",
      status: "UNDER_MAINTENANCE",
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "WorkOrder",
    entityId: wo.id,
    action: "CREATE",
    diff: { assetTag: asset.assetTag, title },
  });

  return NextResponse.json({ ok: true, id: wo.id });
}
