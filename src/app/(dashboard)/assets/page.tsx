import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetsTable } from "./assets-table";
import { AssetFilters } from "./asset-filters";
import { hasCapability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AssetsBulkActions } from "./assets-bulk-actions";

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
  const poolId = params.pool;
  const search = params.q;

  const baseWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const where = {
    ...baseWhere,
    ...(status && { lifecycleState: status }),
    ...(type && { assetType: { category: type } }),
    ...(orgUnit && { ownerOrgUnitId: orgUnit }),
    ...(poolId && { poolId }),
    ...(search && {
      OR: [
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
        { assetType: { name: { contains: search } } },
      ],
    }),
  };

  const [assets, orgUnits, types, pools] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        ownerOrgUnit: true,
        location: true,
        assignedUser: true,
        pool: true,
      },
      take: 500,
    }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.assetType.findMany({ where: { tenantId } }),
    prisma.inventoryPool.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  const canWrite = hasCapability(role, "assets:write");

  const [availableCount, issuedCount, totalCount] = await Promise.all([
    prisma.asset.count({
      where: { ...baseWhere, lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
    }),
    prisma.asset.count({ where: { ...baseWhere, lifecycleState: "CHECKED_OUT" } }),
    prisma.asset.count({ where: baseWhere }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--text-0)]">Tool Management</h1>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Total Tools</p>
          <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{totalCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Available</p>
          <p className="text-2xl font-bold text-[var(--status-available)]">{availableCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Issued</p>
          <p className="text-2xl font-bold text-[var(--status-issued)]">{issuedCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Calibration Due</p>
          <p className="text-2xl font-bold text-[var(--status-maintenance)]">—</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {canWrite && (
          <Button asChild className="bg-[var(--brand-red)] hover:opacity-90 text-white border-0">
            <Link href="/assets/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Link>
          </Button>
        )}
        <div className="flex flex-wrap gap-2 sm:items-center">
          <AssetsBulkActions />
        </div>
      </div>

      <AssetFilters orgUnits={orgUnits} types={types} pools={pools} />

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden shadow-sm">
        <AssetsTable assets={assets} canWrite={canWrite} />
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] text-sm text-[var(--text-2)]">
          Showing 1 — {assets.length} of {totalCount} tools
        </div>
      </div>
    </div>
  );
}
