import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const rowSchema = z.object({
  assetTag: z.string().min(1),
  typeName: z.string().min(1),
  serialNumber: z.string().optional(),
  orgUnitName: z.string().optional(),
  locationName: z.string().optional(),
  poolName: z.string().optional(),
  purchaseCost: z.number().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const { rows } = parsed.data;

  for (const row of rows) {
    const [assetType] = await prisma.$transaction([
      prisma.assetType.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: row.typeName,
          },
        },
        update: {},
        create: {
          tenantId,
          name: row.typeName,
          category: "tool",
        },
      }),
    ]);

    let ownerOrgUnitId: string | undefined;
    if (row.orgUnitName) {
      const org = await prisma.orgUnit.upsert({
        where: {
          tenantId_name_kind: {
            tenantId,
            name: row.orgUnitName,
            kind: "mechanical",
          },
        },
        update: {},
        create: {
          tenantId,
          name: row.orgUnitName,
          kind: "mechanical",
        },
      });
      ownerOrgUnitId = org.id;
    }

    let locationId: string | undefined;
    if (row.locationName) {
      const loc = await prisma.location.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: row.locationName,
          },
        },
        update: {},
        create: {
          tenantId,
          name: row.locationName,
          path: row.locationName,
        },
      });
      locationId = loc.id;
    }

    let poolId: string | undefined;
    if (row.poolName) {
      const pool = await prisma.inventoryPool.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: row.poolName,
          },
        },
        update: {},
        create: {
          tenantId,
          name: row.poolName,
        },
      });
      poolId = pool.id;
    }

    await prisma.asset.upsert({
      where: {
        tenantId_assetTag: {
          tenantId,
          assetTag: row.assetTag,
        },
      },
      update: {
        assetTypeId: assetType.id,
        serialNumber: row.serialNumber || null,
        ownerOrgUnitId: ownerOrgUnitId ?? null,
        locationId: locationId ?? null,
        poolId: poolId ?? null,
        purchaseCost: row.purchaseCost ?? null,
      },
      create: {
        tenantId,
        assetTypeId: assetType.id,
        assetTag: row.assetTag,
        serialNumber: row.serialNumber || null,
        lifecycleState: "IN_SERVICE",
        status: "IN_SERVICE",
        condition: "GOOD",
        criticality: "NORMAL",
        ownerOrgUnitId: ownerOrgUnitId ?? null,
        locationId: locationId ?? null,
        poolId: poolId ?? null,
        purchaseCost: row.purchaseCost ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

