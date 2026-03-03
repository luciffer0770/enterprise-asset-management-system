import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Calendar,
  Wrench,
  FlaskConical,
  Package,
  ArrowRight,
} from "lucide-react";
import { hasCapability } from "@/lib/permissions";

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

  // Build asset filter for non-admin
  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  let overdueCount: number, reservationsToday: number, woBacklog: number, calibrationOverdue: number, assetCount: number;
  try {
    [overdueCount, reservationsToday, woBacklog, calibrationOverdue, assetCount] =
    await Promise.all([
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
      prisma.calibrationEvent.findMany({
        where: { asset: assetWhere },
        orderBy: { nextDueDate: "asc" },
        take: 50,
      }).then((events) =>
        events.filter((e) => e.nextDueDate && e.nextDueDate < new Date()).length
      ),
      prisma.asset.count({ where: assetWhere }),
    ]);
  } catch (e) {
    console.error("Dashboard data fetch error:", e);
    throw new Error("Unable to load dashboard. Ensure npm run setup was run.");
  }

  const widgets = [
    {
      id: "overdues",
      title: "Overdue checkouts",
      value: overdueCount,
      trend: "+0",
      icon: ClipboardCheck,
      href: "/checkout?filter=overdue",
      cap: "checkout" as const,
    },
    {
      id: "reservations",
      title: "Reservations today",
      value: reservationsToday,
      icon: Calendar,
      href: "/reservations",
      cap: "reservations" as const,
    },
    {
      id: "wo_backlog",
      title: "Work order backlog",
      value: woBacklog,
      icon: Wrench,
      href: "/work-orders",
      cap: "workorders:read" as const,
    },
    {
      id: "calibration",
      title: "Calibration overdue",
      value: calibrationOverdue,
      icon: FlaskConical,
      href: "/calibration",
      cap: "calibration:read" as const,
    },
    {
      id: "assets",
      title: "Total assets",
      value: assetCount,
      icon: Package,
      href: "/assets",
      cap: "assets:read" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-0)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-2)] mt-1">
          Welcome, {session?.user?.name ?? "User"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {widgets
          .filter((w) => hasCapability(role, w.cap))
          .map((widget) => (
            <Card key={widget.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                  {widget.title}
                </CardTitle>
                <widget.icon className="h-4 w-4 text-[var(--neutral-dark)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{widget.value}</div>
                {widget.trend && (
                  <Badge variant="info" className="mt-1">
                    {widget.trend} today
                  </Badge>
                )}
                <Link href={widget.href}>
                  <Button variant="link" size="sm" className="mt-2 px-0 h-auto">
                    View <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
