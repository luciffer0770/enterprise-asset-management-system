import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  assetTag: z.string().min(1),
  serialNumber: z.string().optional(),
  assetTypeId: z.string(),
  ownerOrgUnitId: z.string().optional(),
  locationId: z.string().optional(),
  poolId: z.string().optional(),
  purchaseCost: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "assets:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";

  if (role !== "ADMIN" && parsed.data.ownerOrgUnitId && !orgUnitIds.includes(parsed.data.ownerOrgUnitId)) {
    return NextResponse.json({ message: "Cannot assign to another org unit" }, { status: 403 });
  }

  const existing = await prisma.asset.findFirst({
    where: { tenantId, assetTag: parsed.data.assetTag },
  });
  if (existing) {
    return NextResponse.json({ message: "Asset tag already exists" }, { status: 409 });
  }

  const asset = await prisma.asset.create({
    data: {
      tenantId,
      assetTypeId: parsed.data.assetTypeId,
      assetTag: parsed.data.assetTag,
      serialNumber: parsed.data.serialNumber,
      ownerOrgUnitId: parsed.data.ownerOrgUnitId,
      locationId: parsed.data.locationId,
      poolId: parsed.data.poolId,
      lifecycleState: "IN_SERVICE",
      purchaseCost: parsed.data.purchaseCost,
      purchaseDate: parsed.data.purchaseCost ? new Date() : null,
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Asset",
    entityId: asset.id,
    action: "CREATE",
    diff: { assetTag: asset.assetTag },
  });

  return NextResponse.json({ ok: true, id: asset.id });
}
