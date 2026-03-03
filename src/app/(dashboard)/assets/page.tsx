import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetsTable } from "./assets-table";
import { AssetFilters } from "./asset-filters";
import { AssetImportExport } from "./asset-import-export";
import { hasCapability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const params = await searchParams;
  const status = params.status;
  const type = params.type;
  const orgUnit = params.orgUnit;
  const search = params.q;

  const baseWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const safeOrgUnit = orgUnit && (role === "ADMIN" || orgUnitIds.includes(orgUnit)) ? orgUnit : undefined;

  const where = {
    ...baseWhere,
    ...(status && { lifecycleState: status }),
    ...(type && { assetType: { category: type } }),
    ...(safeOrgUnit && { ownerOrgUnitId: safeOrgUnit }),
    ...(search && {
      OR: [
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
      ],
    }),
  };

  const [assets, orgUnits, types, totalCount, availableCount, issuedCount, calibrationDueCount] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        ownerOrgUnit: true,
        location: true,
        trolley: { include: { project: true } },
        assignedUser: true,
      },
      take: 500,
    }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.assetType.findMany({ where: { tenantId } }),
    prisma.asset.count({ where: baseWhere }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "IN_SERVICE" } }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "CHECKED_OUT" } }),
    prisma.calibrationEvent.count({
      where: {
        asset: baseWhere,
        nextDueDate: { lte: new Date(Date.now() + 30 * 86400000) },
      },
    }),
  ]);

  const canWrite = hasCapability(role, "assets:write");

  const kpis = [
    { label: "Total Tools", value: totalCount, color: "text-[var(--brand-dark-blue)]" },
    { label: "Available", value: availableCount, color: "text-[var(--success)]" },
    { label: "Issued", value: issuedCount, color: "text-[var(--brand-red)]" },
    { label: "Calibration Due", value: calibrationDueCount, color: "text-[var(--warning)]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tool Management</h1>
        <div className="flex items-center gap-2">
          <AssetImportExport canWrite={canWrite} />
          {canWrite && (
            <Button asChild className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90">
              <Link href="/assets/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]"
          >
            <p className="text-sm text-[var(--text-2)]">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <AssetFilters orgUnits={orgUnits} types={types} />
      </Suspense>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
        <AssetsTable assets={assets} canWrite={canWrite} />
      </div>
    </div>
  );
}
