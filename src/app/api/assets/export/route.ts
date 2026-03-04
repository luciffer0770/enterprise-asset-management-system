import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const assets = await prisma.asset.findMany({
    where: { tenantId },
    include: {
      assetType: true,
      ownerOrgUnit: true,
      location: true,
      pool: true,
    },
    orderBy: { assetTag: "asc" },
  });

  const header = [
    "assetTag",
    "typeName",
    "serialNumber",
    "orgUnitName",
    "locationName",
    "poolName",
    "purchaseCost",
  ];

  const lines = assets.map((a) =>
    [
      csvEscape(a.assetTag),
      csvEscape(a.assetType.name),
      csvEscape(a.serialNumber ?? ""),
      csvEscape(a.ownerOrgUnit?.name ?? ""),
      csvEscape(a.location?.name ?? ""),
      csvEscape(a.pool?.name ?? ""),
      csvEscape(a.purchaseCost ?? ""),
    ].join(","),
  );

  const csv = [header.join(","), ...lines].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="assets-export.csv"',
    },
  });
}

