import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  condition: z.string().optional(),
  locationId: z.string().nullable().optional(),
  poolId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "assets:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session.user as { id?: string })?.id ?? "";
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";

  const asset = await prisma.asset.findFirst({
    where: {
      id,
      tenantId,
      ...(role !== "ADMIN" && orgUnitIds.length && { ownerOrgUnitId: { in: orgUnitIds } }),
    },
  });

  if (!asset) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const prev = { condition: asset.condition, locationId: asset.locationId, poolId: asset.poolId };
  const updates: Record<string, unknown> = {};
  if (parsed.data.condition != null) updates.condition = parsed.data.condition;
  if (parsed.data.locationId !== undefined) updates.locationId = parsed.data.locationId;
  if (parsed.data.poolId !== undefined) updates.poolId = parsed.data.poolId;

  await prisma.asset.update({
    where: { id },
    data: updates,
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Asset",
    entityId: id,
    action: "UPDATE",
    diff: { prev, ...updates },
  });

  return NextResponse.json({ ok: true });
}
