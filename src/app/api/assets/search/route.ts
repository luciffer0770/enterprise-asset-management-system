import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessOrgUnit } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q");
  const tenantId = req.nextUrl.searchParams.get("tenantId") ?? (session.user as { tenantId?: string }).tenantId;
  if (!q?.trim() || !tenantId) {
    return NextResponse.json({ assets: [] });
  }

  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session.user as { id?: string })?.id ?? "";

  const baseWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const assets = await prisma.asset.findMany({
    where: {
      ...baseWhere,
      OR: [
        { assetTag: { contains: q } },
        { serialNumber: { contains: q } },
      ],
    },
    include: { assetType: true },
    take: 20,
  });

  return NextResponse.json({ assets });
}
