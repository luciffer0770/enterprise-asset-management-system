import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { hasCapability } from "@/lib/permissions";
import { EditAssetForm } from "./edit-asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:write")) {
    return <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>;
  }

  const { id } = await params;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const asset = await prisma.asset.findFirst({
    where: {
      id,
      tenantId,
      ...(role !== "ADMIN" && orgUnitIds.length && { ownerOrgUnitId: { in: orgUnitIds } }),
    },
    include: { assetType: true },
  });

  if (!asset) notFound();

  const [types, orgUnits, locations, pools] = await Promise.all([
    prisma.assetType.findMany({ where: { tenantId } }),
    prisma.orgUnit.findMany({ where: { tenantId } }),
    prisma.location.findMany({ where: { tenantId } }),
    prisma.inventoryPool.findMany({ where: { tenantId } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Asset</h1>
      <EditAssetForm
        asset={asset}
        types={types}
        orgUnits={orgUnits}
        locations={locations}
        pools={pools}
      />
    </div>
  );
}
