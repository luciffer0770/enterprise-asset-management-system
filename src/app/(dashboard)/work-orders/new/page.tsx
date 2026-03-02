import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { WorkOrderForm } from "./work-order-form";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "workorders:write")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>
    );
  }

  const params = await searchParams;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const asset = params.assetId
    ? await prisma.asset.findFirst({
        where: { id: params.assetId, ...assetWhere },
        include: { assetType: true },
      })
    : null;

  const assets = await prisma.asset.findMany({
    where: assetWhere,
    include: { assetType: true },
    take: 100,
  });

  const users = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    take: 50,
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">New Work Order</h1>
      <WorkOrderForm
        asset={asset}
        assets={assets}
        users={users}
      />
    </div>
  );
}
