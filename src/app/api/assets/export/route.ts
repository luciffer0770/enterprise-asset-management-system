import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "assets:read")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const role = (session.user as { role?: string })?.role ?? "EXTERNAL";
  const userId = (session.user as { id?: string })?.id ?? "";

  const where =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assetType: true,
      ownerOrgUnit: true,
      trolley: { include: { project: true } },
    },
    take: 10000,
  });

  const rows = assets.map((a) => ({
    "Tool Code": a.assetTag,
    "Serial Number": a.serialNumber ?? "",
    "Type": a.assetType.name,
    "Category": a.assetType.category,
    "Status": a.lifecycleState,
    "Org Unit": a.ownerOrgUnit?.name ?? "",
    "Location": a.locationPath ?? "",
    "Trolley": a.trolley ? `${a.trolley.trolleyCode} (${a.trolley.project.name})` : "",
    "Project": a.trolley?.project.name ?? "",
    "Condition": a.condition,
    "Purchase Cost": a.purchaseCost ?? "",
    "Purchase Date": a.purchaseDate ? a.purchaseDate.toISOString().slice(0, 10) : "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tools");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tools-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
