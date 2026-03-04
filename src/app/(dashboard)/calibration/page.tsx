import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CalibrationTable } from "./calibration-table";
import { hasCapability } from "@/lib/permissions";

export default async function CalibrationPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "calibration:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view calibration.
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
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const calibrations = await prisma.calibrationEvent.findMany({
    where: { asset: assetWhere },
    include: {
      asset: { include: { assetType: true } },
    },
    orderBy: { nextDueDate: "asc" },
    take: 100,
  });

  const overdue = calibrations.filter(
    (c) => c.nextDueDate && c.nextDueDate < new Date()
  );
  const dueSoon = calibrations.filter(
    (c) =>
      c.nextDueDate &&
      c.nextDueDate >= new Date() &&
      c.nextDueDate < new Date(Date.now() + 30 * 86400000)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calibration</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--error)]/10">
            <h2 className="font-semibold text-[var(--error)]">Overdue</h2>
            <p className="text-sm text-[var(--text-2)]">{overdue.length} items</p>
          </div>
          <CalibrationTable items={overdue} canWrite={hasCapability(role, "calibration:write")} />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--warning)]/10">
            <h2 className="font-semibold">Due Soon (30 days)</h2>
            <p className="text-sm text-[var(--text-2)]">{dueSoon.length} items</p>
          </div>
          <CalibrationTable items={dueSoon} canWrite={hasCapability(role, "calibration:write")} />
        </div>
      </div>
    </div>
  );
}
