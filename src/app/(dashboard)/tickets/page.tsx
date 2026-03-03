import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketQueue } from "./ticket-queue";
import { IssueToolSection } from "./issue-tool-section";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "checkout")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to access tickets.
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const assetWhere =
    role === "ADMIN" || role === "LAB_INCHARGE"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds.length ? orgUnitIds : ["__none__"] } };

  const [activeCheckouts, pendingTicketsList, overdueCheckouts, ticketsClosedToday, allCheckouts, availableAssets] =
    await Promise.all([
      prisma.checkout.count({ where: { returnedAt: null, asset: { tenantId } } }),
      prisma.returnTicket.findMany({
        where: { status: "PENDING_APPROVAL", checkout: { asset: { tenantId } } },
        include: {
          checkout: {
            include: {
              asset: { include: { assetType: true } },
              borrower: true,
              returnTicket: true,
            },
          },
        },
      }),
      prisma.checkout.count({
        where: {
          returnedAt: null,
          dueDate: { lt: now },
          asset: { tenantId },
        },
      }),
      prisma.returnTicket.count({
        where: {
          status: { in: ["APPROVED", "CLOSED"] },
          closedAt: { gte: todayStart },
          checkout: { asset: { tenantId } },
        },
      }),
      prisma.checkout.findMany({
        where: { asset: { tenantId } },
        include: {
          asset: { include: { assetType: true } },
          borrower: true,
          returnTicket: true,
        },
        orderBy: { checkedOutAt: "desc" },
        take: 100,
      }),
      prisma.asset.findMany({
        where: { ...assetWhere, lifecycleState: "IN_SERVICE" },
        include: { assetType: true },
        take: 200,
      }),
    ]);

  const pendingTickets = pendingTicketsList.length;
  const kpis = [
    { label: "Active (Issued)", value: activeCheckouts, color: "text-[var(--brand-red)]", href: "/tickets?status=active" },
    { label: "Pending Approval", value: pendingTickets, color: "text-[var(--warning)]", href: "/tickets?status=pending" },
    { label: "Overdue", value: overdueCheckouts, color: "text-[var(--error)]", href: "/tickets?status=overdue" },
    { label: "Closed Today", value: ticketsClosedToday, color: "text-[var(--success)]", href: "/tickets?status=closed" },
  ];

  const canApprove = hasCapability(role, "tickets:approve");
  const canCheckout = hasCapability(role, "checkout");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ticket Management</h1>

      {canCheckout && (
        <IssueToolSection
          availableAssets={availableAssets}
          tenantId={tenantId}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="border-[var(--border)] hover:border-[var(--brand-dark-blue)] transition-colors h-full">
              <CardContent className="p-4">
                <p className="text-sm text-[var(--text-2)]">{k.label}</p>
                <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <TicketQueue
        checkouts={allCheckouts}
        pendingTickets={pendingTicketsList}
        statusFilter={statusFilter}
        canApprove={canApprove}
        canReturn={canCheckout}
      />
    </div>
  );
}
