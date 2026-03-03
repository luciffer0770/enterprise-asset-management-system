import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkOrdersKanban } from "./work-orders-kanban";
import { hasCapability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function WorkOrdersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "workorders:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view work orders.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const workOrders = await prisma.workOrder.findMany({
    where: { asset: assetWhere },
    include: {
      asset: { include: { assetType: true } },
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const canWrite = hasCapability(role, "workorders:write");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        {canWrite && (
          <Button asChild>
            <Link href="/work-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Link>
          </Button>
        )}
      </div>

      <WorkOrdersKanban workOrders={workOrders} canWrite={canWrite} />
    </div>
  );
}
