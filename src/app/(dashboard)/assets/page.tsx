import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetsTable } from "./assets-table";
import { AssetFilters } from "./asset-filters";
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

  const [assets, orgUnits, types] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        ownerOrgUnit: true,
        location: true,
        assignedUser: true,
      },
      take: 500,
    }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.assetType.findMany({ where: { tenantId } }),
  ]);

  const canWrite = hasCapability(role, "assets:write");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Asset Registry</h1>
        {canWrite && (
          <Button asChild>
            <Link href="/assets/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Link>
          </Button>
        )}
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
