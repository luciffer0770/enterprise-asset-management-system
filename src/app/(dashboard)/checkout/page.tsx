import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutForm } from "./checkout-form";
import { OverdueList } from "./overdue-list";
import { hasCapability } from "@/lib/permissions";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string; filter?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "checkout")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to checkout assets.
      </div>
    );
  }

  const params = await searchParams;
  const assetId = params.assetId;
  const showOverdue = params.filter === "overdue";

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const asset = assetId
    ? await prisma.asset.findFirst({
        where: { id: assetId, ...assetWhere },
        include: { assetType: true },
      })
    : null;

  const overdueCheckouts = showOverdue
    ? await prisma.checkout.findMany({
        where: {
          returnedAt: null,
          dueDate: { lt: new Date() },
          asset: assetWhere,
        },
        include: {
          asset: { include: { assetType: true } },
          borrower: true,
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Checkout / Return</h1>

      {showOverdue && (
        <OverdueList checkouts={overdueCheckouts} />
      )}

      {!showOverdue && (
        <CheckoutForm
          asset={asset}
          userId={userId}
          tenantId={tenantId}
          role={role}
        />
      )}
    </div>
  );
}
