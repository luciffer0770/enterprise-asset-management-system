import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Calendar,
  Wrench,
  FlaskConical,
  Package,
  ArrowRight,
  TicketCheck,
} from "lucide-react";
import { hasCapability } from "@/lib/permissions";
import { AssetStatusChart } from "./asset-status-chart";
import { TicketTrendChart } from "./ticket-trend-chart";
import { ToolsByOrgChart } from "./tools-by-org-chart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  // Build asset filter for non-admin
  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const [
    overdueCount,
    reservationsToday,
    woBacklog,
    calibrationOverdue,
    assetCount,
    availableCount,
    issuedCount,
    statusCounts,
    pendingTicketsCount,
    ticketByStatus,
    toolsByOrg,
  ] = await Promise.all([
    prisma.checkout.count({
      where: {
        returnedAt: null,
        dueDate: { lt: new Date() },
        asset: assetWhere,
      },
    }),
    prisma.reservation.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startDate: { lte: new Date(new Date().setHours(23, 59, 59)) },
        endDate: { gte: new Date(new Date().setHours(0, 0, 0)) },
      },
    }),
    prisma.workOrder.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, asset: assetWhere },
    }),
    prisma.calibrationEvent
      .findMany({
        where: { asset: assetWhere },
        orderBy: { nextDueDate: "asc" },
        take: 50,
      })
      .then((events) =>
        events.filter((e) => e.nextDueDate && e.nextDueDate < new Date()).length
      ),
    prisma.asset.count({ where: assetWhere }),
    prisma.asset.count({
      where: { ...assetWhere, lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
    }),
    prisma.asset.count({
      where: { ...assetWhere, lifecycleState: "CHECKED_OUT" },
    }),
    prisma.asset.findMany({
      where: assetWhere,
      select: { lifecycleState: true },
    }).then((rows) => {
      const map: Record<string, number> = {};
      rows.forEach((r) => {
        map[r.lifecycleState] = (map[r.lifecycleState] ?? 0) + 1;
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    }),
    hasCapability(role, "tickets:approve") && prisma.returnTicket
      ? prisma.returnTicket.count({
          where: { tenantId, status: "PENDING_APPROVAL" },
        })
      : 0,
    prisma.returnTicket
      ? prisma.returnTicket
          .findMany({ where: { tenantId }, select: { status: true } })
          .then((rows) => {
            const map: Record<string, number> = {};
            rows.forEach((r) => {
              map[r.status] = (map[r.status] ?? 0) + 1;
            });
            return Object.entries(map).map(([status, count]) => ({ status, count }));
          })
      : Promise.resolve([] as { status: string; count: number }[]),
    prisma.asset
      .groupBy({
        by: ["ownerOrgUnitId"],
        where: assetWhere,
        _count: { id: true },
      })
      .then(async (groups) => {
        const orgIds = groups.map((g) => g.ownerOrgUnitId).filter(Boolean) as string[];
        const orgs = orgIds.length
          ? await prisma.orgUnit.findMany({
              where: { id: { in: orgIds } },
              select: { id: true, name: true },
            })
          : [];
        const nameById = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
        return groups.map((g) => ({
          name: g.ownerOrgUnitId ? (nameById[g.ownerOrgUnitId] ?? "—") : "Unassigned",
          count: g._count.id,
        }));
      }),
  ]);

  const metricCards = [
    {
      id: "total",
      title: "Total Tools",
      value: assetCount,
      icon: Package,
      theme: "blue" as const,
      href: "/assets",
      cap: "assets:read" as const,
    },
    {
      id: "available",
      title: "Available",
      value: availableCount,
      icon: Package,
      theme: "green" as const,
      href: "/assets?status=IN_SERVICE",
      cap: "assets:read" as const,
    },
    {
      id: "issued",
      title: "Issued",
      value: issuedCount,
      icon: ClipboardCheck,
      theme: "red" as const,
      href: "/checkout",
      cap: "checkout" as const,
    },
    {
      id: "calibration",
      title: "Calibration Due",
      value: calibrationOverdue,
      sub: "Due This Month",
      icon: FlaskConical,
      theme: "orange" as const,
      href: "/calibration",
      cap: "calibration:read" as const,
    },
  ];

  const cardThemes = {
    blue: "bg-[var(--brand-light-blue)]/10 border-[var(--brand-light-blue)]/30 text-[var(--brand-dark-blue)]",
    green: "bg-[var(--status-available)]/10 border-[var(--status-available)]/30 text-[var(--brand-dark-green)]",
    red: "bg-[var(--status-issued)]/10 border-[var(--status-issued)]/30 text-[var(--status-issued)]",
    orange: "bg-[var(--status-maintenance)]/15 border-[var(--status-maintenance)]/40 text-[#B45309]",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-0)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-2)] mt-1">
          Welcome, {session?.user?.name ?? "User"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards
          .filter((w) => hasCapability(role, w.cap))
          .map((widget) => (
            <Link key={widget.id} href={widget.href}>
              <Card
                className={`border ${cardThemes[widget.theme]} hover:opacity-95 transition-opacity cursor-pointer`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    {widget.title}
                  </CardTitle>
                  <widget.icon className="h-5 w-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{widget.value.toLocaleString()}</div>
                  {widget.sub && (
                    <p className="text-xs mt-1 opacity-80">{widget.sub}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {statusCounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Asset status distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssetStatusChart data={statusCounts} />
            </CardContent>
          </Card>
        )}
        {ticketByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Tickets by status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTrendChart data={ticketByStatus} />
            </CardContent>
          </Card>
        )}
        {toolsByOrg.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Tools by department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ToolsByOrgChart data={toolsByOrg} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasCapability(role, "tickets:approve") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Tickets pending approval
              </CardTitle>
              <TicketCheck className="h-4 w-4 text-[var(--neutral-dark)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingTicketsCount}</div>
              <Link href="/checkout">
                <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                  Review <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {hasCapability(role, "checkout") && overdueCount > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Overdue checkouts
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-[var(--neutral-dark)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{overdueCount}</div>
              <Link href="/checkout?filter=overdue">
                <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {hasCapability(role, "reservations") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Reservations today
              </CardTitle>
              <Calendar className="h-4 w-4 text-[var(--neutral-dark)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{reservationsToday}</div>
              <Link href="/reservations">
                <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {hasCapability(role, "workorders:read") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                Work order backlog
              </CardTitle>
              <Wrench className="h-4 w-4 text-[var(--neutral-dark)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{woBacklog}</div>
              <Link href="/work-orders">
                <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
