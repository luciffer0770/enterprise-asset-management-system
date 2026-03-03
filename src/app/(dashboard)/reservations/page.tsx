import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReservationsCalendar } from "./reservations-calendar";
import { hasCapability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "reservations")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view reservations.
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 2);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [{ asset: assetWhere }, { assetId: null }],
      startDate: { lte: endOfMonth },
      endDate: { gte: startOfMonth },
    },
    include: {
      asset: { include: { assetType: true } },
      requester: true,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <Button asChild>
          <Link href="/reservations/new">
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Link>
        </Button>
      </div>

      <ReservationsCalendar reservations={reservations} />
    </div>
  );
}
