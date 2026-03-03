import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { NewAssetForm } from "./new-asset-form";

export default async function NewAssetPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:write")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const [types, orgUnits, locations, pools, trolleys] = await Promise.all([
    prisma.assetType.findMany({ where: { tenantId } }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.location.findMany({ where: { tenantId } }),
    prisma.inventoryPool.findMany({ where: { tenantId } }),
    prisma.trolley.findMany({ where: { tenantId }, include: { project: true }, orderBy: { trolleyCode: "asc" } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Add Tool</h1>
      <NewAssetForm
        types={types}
        orgUnits={orgUnits}
        locations={locations}
        pools={pools}
        trolleys={trolleys}
      />
    </div>
  );
}
