import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, Calendar, Wrench } from "lucide-react";
import { canAccessAsset, hasCapability } from "@/lib/permissions";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetType: true,
      ownerOrgUnit: true,
      location: true,
      pool: true,
      assignedUser: true,
      checkouts: { take: 5, orderBy: { checkedOutAt: "desc" }, include: { borrower: true } },
      reservations: { take: 5, orderBy: { startDate: "desc" } },
      workOrders: { take: 5 },
      calibrations: { take: 5, orderBy: { performedDate: "desc" } },
    },
  });

  if (!asset) notFound();

  const canAccess = canAccessAsset(
    role,
    orgUnitIds,
    asset.assignedUserId,
    asset.ownerOrgUnitId,
    userId
  );
  if (!canAccess) notFound();

  const canCheckout = hasCapability(role, "checkout");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{asset.assetTag}</CardTitle>
                <Badge
                  variant={
                    asset.lifecycleState === "IN_SERVICE"
                      ? "success"
                      : asset.lifecycleState === "DISPOSED"
                        ? "error"
                        : "info"
                  }
                >
                  {asset.lifecycleState}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-2)]">Serial</span>
                  <p className="font-medium">{asset.serialNumber ?? "—"}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Type</span>
                  <p className="font-medium">{asset.assetType.name}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Org Unit</span>
                  <p className="font-medium">{asset.ownerOrgUnit?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Location</span>
                  <p className="font-medium">{asset.location?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Condition</span>
                  <p className="font-medium">{asset.condition}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Criticality</span>
                  <p className="font-medium">{asset.criticality}</p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Purchase Cost</span>
                  <p className="font-medium">
                    {asset.purchaseCost != null
                      ? `$${asset.purchaseCost.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-2)]">Assigned To</span>
                  <p className="font-medium">{asset.assignedUser?.displayName ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Checkouts</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.checkouts.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">No checkouts yet</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {asset.checkouts.map((c) => (
                    <li key={c.id} className="flex justify-between">
                      <span>{c.borrower?.displayName ?? "—"}</span>
                      <span className="text-[var(--text-2)]">
                        {c.returnedAt
                          ? `Returned ${new Date(c.returnedAt).toLocaleDateString()}`
                          : "Out"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {canCheckout && asset.lifecycleState === "IN_SERVICE" && (
            <Card>
              <CardContent className="pt-4">
                <Button className="w-full" asChild>
                  <Link href={`/checkout?assetId=${asset.id}`}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Checkout
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full mt-2" asChild>
                  <Link href={`/reservations/new?assetId=${asset.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Reserve
                  </Link>
                </Button>
                {hasCapability(role, "workorders:write") && (
                  <Button variant="secondary" className="w-full mt-2" asChild>
                    <Link href={`/work-orders/new?assetId=${asset.id}`}>
                      <Wrench className="h-4 w-4 mr-2" />
                      Create Work Order
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.workOrders.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">None</p>
              ) : (
                <ul className="space-y-2">
                  {asset.workOrders.map((wo) => (
                    <li key={wo.id}>
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="text-sm text-[var(--brand-dark-blue)] hover:underline"
                      >
                        {wo.title} — {wo.status}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
