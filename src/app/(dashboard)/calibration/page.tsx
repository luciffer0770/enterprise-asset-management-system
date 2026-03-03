import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CalibrationClient } from "./calibration-client";
import { hasCapability } from "@/lib/permissions";

export default async function CalibrationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "calibration:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view calibration.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const params = await searchParams;
  const assetType = params.assetType;
  const status = params.status;
  const q = params.q;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize ?? "20", 10) || 20));
  const skip = (page - 1) * pageSize;

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const baseAssetWhere = {
    ...assetWhere,
    assetType: { requiresCalibration: true },
    ...(assetType && { assetTypeId: assetType }),
    ...(q && {
      OR: [
        { assetTag: { contains: q } },
        { assetType: { name: { contains: q } } },
      ],
    }),
  };

  const statusWhere =
    status === "Overdue"
      ? { nextDueDate: { lt: now } }
      : status === "Due"
        ? { nextDueDate: { gte: now, lte: in30 } }
        : status === "Valid"
          ? { OR: [{ nextDueDate: { gt: in30 } }, { nextDueDate: null }] }
          : {};

  const baseWhere = {
    asset: baseAssetWhere,
    ...statusWhere,
  };

  const [paginatedItems, totalCount, allItems] = await Promise.all([
    prisma.calibrationEvent.findMany({
      where: baseWhere,
      include: {
        asset: { include: { assetType: true, location: true } },
      },
      orderBy: { nextDueDate: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.calibrationEvent.count({ where: baseWhere }),
    prisma.calibrationEvent.findMany({
      where: { asset: { ...assetWhere, assetType: { requiresCalibration: true } } },
      select: { nextDueDate: true, result: true },
    }),
  ]);

  const total = allItems.length;
  const overdue = allItems.filter((c) => c.nextDueDate && new Date(c.nextDueDate) < now).length;
  const dueIn30 = allItems.filter(
    (c) =>
      c.nextDueDate &&
      new Date(c.nextDueDate) >= now &&
      new Date(c.nextDueDate) <= in30
  ).length;
  const oot = allItems.filter((c) => c.result === "OOT").length;
  const compliance = total > 0 ? Math.round(((total - overdue) / total) * 1000) / 10 : 100;

  const statusCounts = [
    { name: "Valid", value: total - overdue - dueIn30, color: "#10b981" },
    { name: "Due", value: dueIn30, color: "#f59e0b" },
    { name: "Overdue", value: overdue, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  if (statusCounts.length === 0) {
    statusCounts.push({ name: "No data", value: 1, color: "#94a3b8" });
  }

  const assetTypes = await prisma.assetType.findMany({
    where: { tenantId, requiresCalibration: true },
    select: { id: true, name: true },
  });

  const canWrite = hasCapability(role, "calibration:write");

  return (
    <CalibrationClient
      items={paginatedItems.map((c) => ({
        id: c.id,
        performedDate: c.performedDate,
        nextDueDate: c.nextDueDate,
        result: c.result,
        certificateUrl: c.certificateUrl,
        asset: {
          id: c.asset.id,
          assetTag: c.asset.assetTag,
          locationPath: c.asset.locationPath,
          location: c.asset.location,
          assetType: { name: c.asset.assetType.name },
        },
      }))}
      kpis={{
        total: totalCount,
        dueIn30,
        overdue,
        oot,
        compliance,
      }}
      statusCounts={statusCounts}
      assetTypes={assetTypes}
      canWrite={canWrite}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      params={params as Record<string, string | undefined>}
    />
  );
}
