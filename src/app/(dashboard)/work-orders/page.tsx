import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkOrdersClient } from "./work-orders-client";
import { hasCapability } from "@/lib/permissions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
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

  const params = await searchParams;
  const type = params.type;
  const priority = params.priority;
  const status = params.status;
  const assignee = params.assignee;
  const q = params.q;
  const overdue = params.overdue === "1";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(params.pageSize ?? "20", 10) || 20));
  const skip = (page - 1) * pageSize;

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const baseWhere = { asset: assetWhere };
  const now = new Date();

  const woWhere = {
    ...baseWhere,
    ...(type && { type }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(assignee && { assignedToId: assignee }),
    ...(overdue && {
      status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      plannedFinish: { lt: now },
    }),
    ...(q && {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { asset: { assetTag: { contains: q } } },
      ],
    }),
  };

  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

  const [workOrders, totalCount, openCount, criticalOverdueCount, pmsDueCount, breakdownsCount, allWOsForChart, users] = await Promise.all([
    prisma.workOrder.findMany({
      where: woWhere,
      include: {
        asset: { include: { location: true } },
        assignedTo: { select: { displayName: true } },
      },
      orderBy: [{ status: "asc" }, { plannedFinish: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.workOrder.count({ where: woWhere }),
    prisma.workOrder.count({
      where: {
        ...baseWhere,
        status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      },
    }),
    prisma.workOrder.count({
      where: {
        ...baseWhere,
        status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
        priority: "CRITICAL",
        plannedFinish: { lt: now },
      },
    }),
    prisma.workOrder.count({
      where: {
        ...baseWhere,
        type: "preventive",
        status: { in: ["OPEN", "IN_PROGRESS"] },
        plannedFinish: { gte: now, lte: new Date(now.getTime() + 30 * 86400000) },
      },
    }),
    prisma.workOrder.count({
      where: {
        ...baseWhere,
        type: "corrective",
        status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      },
    }),
    prisma.workOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: ninetyDaysAgo } },
      select: { type: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, displayName: true },
    }),
  ]);

  const chartByMonth = new Map<string, { corrective: number; preventive: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${MONTHS[d.getMonth()]}`;
    chartByMonth.set(key, { corrective: 0, preventive: 0 });
  }
  for (const wo of allWOsForChart) {
    const d = new Date(wo.createdAt);
    const monthKey = MONTHS[d.getMonth()];
    if (chartByMonth.has(monthKey)) {
      const entry = chartByMonth.get(monthKey)!;
      if (wo.type === "corrective") entry.corrective += 1;
      else entry.preventive += 1;
    }
  }
  const chartData = Array.from(chartByMonth.entries()).map(([month, v]) => ({ month, ...v }));

  const scheduleData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const count = await prisma.workOrder.count({
      where: {
        ...baseWhere,
        type: "preventive",
        status: { in: ["OPEN", "IN_PROGRESS"] },
        plannedFinish: { gte: dayStart, lt: dayEnd },
      },
    });
    scheduleData.push({
      date: dayStart.toISOString().slice(0, 10),
      label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayStart.getDay()] + " " + dayStart.getDate(),
      count,
    });
  }

  const canWrite = hasCapability(role, "workorders:write");

  return (
    <WorkOrdersClient
      workOrders={workOrders.map((wo) => ({
        id: wo.id,
        title: wo.title,
        description: wo.description,
        type: wo.type,
        priority: wo.priority,
        status: wo.status,
        plannedFinish: wo.plannedFinish,
        createdAt: wo.createdAt,
        asset: {
          assetTag: wo.asset.assetTag,
          locationPath: wo.asset.locationPath,
          location: wo.asset.location,
        },
        assignedTo: wo.assignedTo,
      }))}
      kpis={{
        open: openCount,
        criticalOverdue: criticalOverdueCount,
        pmsDue: pmsDueCount,
        breakdowns: breakdownsCount,
      }}
      chartData={chartData}
      scheduleData={scheduleData}
      users={users}
      canWrite={canWrite}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      params={params as Record<string, string | undefined>}
    />
  );
}
