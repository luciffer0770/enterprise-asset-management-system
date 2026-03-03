import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { ReservationsClient } from "./reservations-client";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
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

  const params = await searchParams;
  const monthParam = params.month ?? new Date().toISOString().slice(0, 7);
  const startOfMonth = new Date(monthParam + "-01");
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const reservations = await prisma.reservation.findMany({
    where: {
      requester: { tenantId },
      OR: [{ asset: assetWhere }, { assetId: null }],
      startDate: { lt: endOfMonth },
      endDate: { gt: startOfMonth },
    },
    include: {
      asset: { include: { assetType: true, project: true } },
      requester: true,
    },
    orderBy: { startDate: "asc" },
  });

  const active = reservations.filter((r) => ["PENDING", "CONFIRMED"].includes(r.status)).length;
  const upcoming = reservations.filter(
    (r) =>
      ["PENDING", "CONFIRMED"].includes(r.status) &&
      new Date(r.startDate) >= now &&
      new Date(r.startDate) <= in7Days
  ).length;

  const conflictIds = new Set<string>();
  for (const r of reservations) {
    if (!r.assetId || !["PENDING", "CONFIRMED"].includes(r.status)) continue;
    for (const o of reservations) {
      if (o.id === r.id || o.assetId !== r.assetId || !["PENDING", "CONFIRMED"].includes(o.status)) continue;
      if (new Date(o.startDate) < new Date(r.endDate) && new Date(o.endDate) > new Date(r.startDate)) {
        conflictIds.add(r.id);
        conflictIds.add(o.id);
      }
    }
  }
  const conflictCount = conflictIds.size;

  const overdue = reservations.filter(
    (r) => ["PENDING", "CONFIRMED"].includes(r.status) && new Date(r.endDate) < now
  ).length;

  const projectMap = new Map<string, number>();
  for (const r of reservations) {
    const name = r.asset?.project?.name ?? "No Project";
    projectMap.set(name, (projectMap.get(name) ?? 0) + 1);
  }
  const projectData = Array.from(projectMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  if (projectData.length === 0) projectData.push({ name: "No data", value: 1 });

  const statusCounts: Record<string, number> = {};
  for (const r of reservations) {
    const key = conflictIds.has(r.id) ? "Conflicted" : new Date(r.endDate) < now && ["PENDING", "CONFIRMED"].includes(r.status) ? "Overdue" : r.status;
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }
  const statusData = [
    { name: "Confirmed", value: statusCounts.CONFIRMED ?? 0, color: "#10b981" },
    { name: "Pending", value: statusCounts.PENDING ?? 0, color: "#f59e0b" },
    { name: "Overdue", value: statusCounts.Overdue ?? 0, color: "#ef4444" },
    { name: "Conflicted", value: statusCounts.Conflicted ?? 0, color: "#dc2626" },
    { name: "Cancelled", value: statusCounts.CANCELLED ?? 0, color: "#94a3b8" },
  ].filter((s) => s.value > 0);
  if (statusData.length === 0) statusData.push({ name: "No data", value: 1, color: "#94a3b8" });

  const canWrite = hasCapability(role, "reservations");

  return (
    <ReservationsClient
      reservations={reservations.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        priority: r.priority,
        assetId: r.assetId,
        asset: r.asset
          ? {
              assetTag: r.asset.assetTag,
              assetType: { name: r.asset.assetType.name },
              project: r.asset.project ?? undefined,
            }
          : null,
        requester: { displayName: r.requester.displayName },
      }))}
      kpis={{
        active,
        upcoming,
        conflicts: conflictCount,
        overdue,
      }}
      projectData={projectData}
      statusData={statusData}
      canWrite={canWrite}
      month={monthParam}
    />
  );
}
