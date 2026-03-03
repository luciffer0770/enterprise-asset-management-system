import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { DashboardClient } from "./dashboard-client";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function DashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.error("Dashboard getServerSession error:", e);
    throw new Error("Unable to verify session. Try logging in again.");
  }
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const assetWhere =
    role === "ADMIN" || role === "LAB_INCHARGE"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const [
    totalAssets,
    activeCheckouts,
    workOrders,
    calibrationEvents,
    assetsForCharts,
    checkoutsForTrend,
    overdueCal,
    criticalWO,
    overdueReturns,
    depBooks,
    purchaseSumResult,
  ] = await Promise.all([
    prisma.asset.count({ where: assetWhere }),
    prisma.checkout.count({ where: { returnedAt: null, asset: assetWhere } }),
    prisma.workOrder.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, asset: assetWhere },
      select: { priority: true },
    }),
    prisma.calibrationEvent.findMany({
      where: { asset: assetWhere },
      select: { result: true, nextDueDate: true },
      take: 500,
    }),
    prisma.asset.findMany({
      where: assetWhere,
      select: { lifecycleState: true, ownerOrgUnitId: true },
      take: 5000,
    }),
    prisma.checkout.findMany({
      where: { asset: assetWhere },
      select: { checkedOutAt: true, asset: { select: { ownerOrgUnitId: true } } },
      orderBy: { checkedOutAt: "desc" },
      take: 500,
    }),
    prisma.calibrationEvent.count({
      where: { asset: assetWhere, nextDueDate: { lt: new Date() } },
    }),
    prisma.workOrder.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, priority: "CRITICAL", asset: assetWhere },
    }),
    prisma.checkout.count({
      where: {
        returnedAt: null,
        dueDate: { lt: new Date() },
        asset: assetWhere,
      },
    }),
    prisma.depreciationBook.findMany({
      where: { asset: assetWhere },
      select: { nbv: true },
    }),
    prisma.asset.aggregate({ where: assetWhere, _sum: { purchaseCost: true } }),
  ]);

  const woBacklog = workOrders.length;
  const calibrationTotal = calibrationEvents.length;
  const calibrationPassed = calibrationEvents.filter((e) => e.result === "PASS").length;
  const calibrationCompliance =
    calibrationTotal > 0 ? Math.round((calibrationPassed / calibrationTotal) * 100) : 100;
  const utilizationRate = totalAssets > 0 ? Math.round((activeCheckouts / totalAssets) * 100) : 0;
  const nbvFromDep = depBooks.reduce((s, d) => s + (d.nbv ?? 0), 0);
  const purchaseSum = purchaseSumResult._sum.purchaseCost ?? 0;
  const netBookValue = nbvFromDep > 0 ? nbvFromDep : purchaseSum;

  const statusMap = new Map<string, number>();
  for (const a of assetsForCharts) {
    statusMap.set(a.lifecycleState, (statusMap.get(a.lifecycleState) ?? 0) + 1);
  }
  const lifecycleDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  const totalForPct = lifecycleDistribution.reduce((s, d) => s + d.value, 0);
  const lifecycleDistributionWithPct = lifecycleDistribution.map((d) => ({
    ...d,
    pct: totalForPct > 0 ? Math.round((d.value / totalForPct) * 100) : 0,
  }));

  const priorityMap = new Map<string, number>();
  for (const wo of workOrders) {
    const p = wo.priority || "NORMAL";
    priorityMap.set(p, (priorityMap.get(p) ?? 0) + 1);
  }
  const maintenanceByPriority = Array.from(priorityMap.entries()).map(([priority, count]) => ({
    priority,
    count,
  }));

  const now = new Date();
  const utilizationTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthTotal = assetsForCharts.length;
    const monthCheckouts = checkoutsForTrend.filter(
      (c) => c.checkedOutAt && c.checkedOutAt >= d && c.checkedOutAt <= next
    ).length;
    utilizationTrend.push({
      month: MONTHS[d.getMonth()],
      rate: monthTotal > 0 ? Math.min(100, Math.round((monthCheckouts / monthTotal) * 150)) : 0,
    });
  }

  const alerts: { label: string; count: number; href: string; severity: "warning" | "critical" }[] = [];
  if (overdueCal > 0)
    alerts.push({
      label: "Overdue Calibrations",
      count: overdueCal,
      href: "/calibration",
      severity: "warning",
    });
  if (criticalWO > 0)
    alerts.push({
      label: "Critical Work Orders",
      count: criticalWO,
      href: "/work-orders",
      severity: "critical",
    });
  if (overdueReturns > 0)
    alerts.push({
      label: "Overdue Returns",
      count: overdueReturns,
      href: "/tickets?status=overdue",
      severity: "critical",
    });

  const auditLogs = await prisma.auditLogEvent.findMany({
    where: { tenantId },
    orderBy: { eventTs: "desc" },
    take: 10,
    include: { actor: { select: { email: true } } },
  });
  const recentActivity = auditLogs.map((e) => ({
    type: e.action + " · " + e.entityType,
    id: (e.entityId ?? "").slice(-8).toUpperCase() || "—",
    user: e.actor?.email ?? "—",
    at: e.eventTs.toISOString().slice(0, 16).replace("T", " "),
  }));

  if (!hasCapability(role, "assets:read")) {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have permission to view the dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {session?.user?.name ?? "User"}</p>
      </div>
      <DashboardClient
        kpis={{
          totalAssets,
          activeCheckouts,
          maintenanceBacklog: woBacklog,
          calibrationCompliance,
          utilizationRate,
          netBookValue: Math.round(netBookValue) || 0,
        }}
        maintenanceByPriority={maintenanceByPriority}
        lifecycleDistribution={lifecycleDistribution}
        lifecycleDistributionWithPct={lifecycleDistributionWithPct}
        utilizationTrend={utilizationTrend}
        alerts={alerts}
        recentActivity={recentActivity}
      />
    </div>
  );
}
