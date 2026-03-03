import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { hasCapability } from "@/lib/permissions";
import { WorkOrderStatus } from "./work-order-status";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: { include: { assetType: true, ownerOrgUnit: true } },
      assignedTo: true,
    },
  });

  if (!wo) notFound();

  const canAccess =
    role === "ADMIN" ||
    (wo.asset.ownerOrgUnitId && orgUnitIds?.includes(wo.asset.ownerOrgUnitId));
  if (!canAccess) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/work-orders">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{wo.title}</CardTitle>
            <Badge
              variant={
                wo.status === "COMPLETED"
                  ? "success"
                  : wo.status === "OPEN"
                    ? "warning"
                    : "info"
              }
            >
              {wo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--text-2)]">Type</span>
              <p className="font-medium">{wo.type}</p>
            </div>
            <div>
              <span className="text-[var(--text-2)]">Priority</span>
              <p className="font-medium">{wo.priority}</p>
            </div>
            <div>
              <span className="text-[var(--text-2)]">Asset</span>
              <p className="font-medium">
                <Link
                  href={`/assets/${wo.assetId}`}
                  className="text-[var(--brand-dark-blue)] hover:underline"
                >
                  {wo.asset.assetTag}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-[var(--text-2)]">Assigned To</span>
              <p className="font-medium">{wo.assignedTo?.displayName ?? "—"}</p>
            </div>
          </div>
          {wo.description && (
            <div>
              <span className="text-sm text-[var(--text-2)]">Description</span>
              <p className="mt-1">{wo.description}</p>
            </div>
          )}
          {role === "ADMIN" && (
            <div className="pt-4 border-t border-[var(--border)]">
              <WorkOrderStatus workOrderId={wo.id} currentStatus={wo.status} canChange={true} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
