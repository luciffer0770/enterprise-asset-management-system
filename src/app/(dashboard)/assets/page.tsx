import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetsTable } from "./assets-table";
import { AssetFilterSidebar } from "./asset-filter-sidebar";
import { AssetKPICards } from "./asset-kpi-cards";
import { AssetImportExport } from "./asset-import-export";
import { AssetBulkActions } from "./asset-bulk-actions";
import { AssetSearchBar } from "./asset-search-bar";
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

  const showInactive = params.inactive === "1";
  const whereFiltered = showInactive ? where : { ...where, lifecycleState: { not: "DISPOSED" } };
  const pageSize = Math.min(100, Math.max(10, parseInt(params.pageSize ?? "20", 10) || 20));
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * pageSize;

  const [assets, orgUnits, types, totalCount, availableCount, issuedCount, maintenanceCount, reservedCount, calibrationDueCount, totalFiltered] = await Promise.all([
    prisma.asset.findMany({
      where: whereFiltered,
      include: {
        assetType: true,
        ownerOrgUnit: true,
        location: true,
        trolley: { include: { project: true } },
        assignedUser: true,
      },
      orderBy: { assetTag: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.assetType.findMany({ where: { tenantId } }),
    prisma.asset.count({ where: baseWhere }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "IN_SERVICE" } }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "CHECKED_OUT" } }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "UNDER_MAINTENANCE" } }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "RESERVED" } }),
    prisma.calibrationEvent.count({
      where: {
        asset: baseWhere,
        nextDueDate: { lte: new Date(Date.now() + 30 * 86400000) },
      },
    }),
    prisma.asset.count({ where: whereFiltered }),
  ]);

  const canWrite = hasCapability(role, "assets:write");

  const kpis = [
    { label: "Total Tools", value: totalCount, total: totalCount, color: "text-[var(--brand-dark-blue)]", barColor: "bg-[var(--brand-dark-blue)]", href: "/assets" },
    { label: "In Service", value: availableCount, total: totalCount, color: "text-[var(--success)]", barColor: "bg-[var(--success)]", href: "/assets?status=IN_SERVICE" },
    { label: "Under Maintenance", value: maintenanceCount, total: totalCount, color: "text-[var(--warning)]", barColor: "bg-[var(--warning)]", href: "/assets?status=UNDER_MAINTENANCE" },
    { label: "Reserved", value: reservedCount, total: totalCount, color: "text-[var(--brand-red)]", barColor: "bg-[var(--brand-red)]", href: "/assets?status=RESERVED" },
  ];

  return (
    <div className="flex gap-6">
      <Suspense fallback={<div className="w-52 shrink-0" />}>
        <AssetFilterSidebar
          orgUnits={orgUnits}
          types={types}
          currentOrgUnit={safeOrgUnit ?? ""}
          currentType={type ?? ""}
          currentStatus={status ?? ""}
          showInactive={!!params.inactive}
        />
      </Suspense>

      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Tool Management</h1>
          <div className="flex items-center gap-3">
            <AssetSearchBar />
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
        </div>

        <AssetKPICards kpis={kpis} />

        <AssetBulkActions canCheckout={hasCapability(role, "checkout")} />

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
          <AssetsTable
            assets={assets}
            canWrite={canWrite}
            canCheckout={hasCapability(role, "checkout")}
            totalCount={totalFiltered}
            page={page}
            pageSize={pageSize}
            params={params as Record<string, string | undefined>}
          />
        </div>
      </div>
    </div>
  );
}
