import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutForm } from "./checkout-form";
import { OverdueList } from "./overdue-list";
import { TicketBoard } from "./ticket-board";
import { TicketListTable } from "./ticket-list-table";
import { hasCapability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string; filter?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "checkout")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to checkout assets.
      </div>
    );
  }

  const params = await searchParams;
  const assetId = params.assetId;
  const showOverdue = params.filter === "overdue";

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : role === "EXTERNAL"
        ? { tenantId, assignedUserId: userId }
        : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const asset = assetId
    ? await prisma.asset.findFirst({
        where: { id: assetId, ...assetWhere },
        include: { assetType: true },
      })
    : null;

  const [availableAssets, pools] = await Promise.all([
    prisma.asset.findMany({
      where: { ...assetWhere, lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
      include: { assetType: true, location: true },
      orderBy: { assetTag: "asc" },
      take: 200,
    }),
    role === "MECHANICAL" || role === "ELECTRICAL"
      ? (prisma.inventoryPool
          ? prisma.inventoryPool.findMany({
              where: { tenantId, isActive: true },
              orderBy: { name: "asc" },
              select: { id: true, name: true, code: true },
            })
          : [])
      : [],
  ]);

  const [overdueCheckouts, recentCheckouts] = await Promise.all([
    prisma.checkout.findMany({
      where: {
        returnedAt: null,
        dueDate: { lt: new Date() },
        asset: assetWhere,
      },
      include: {
        asset: { include: { assetType: true } },
        borrower: true,
      },
    }),
    prisma.checkout.findMany({
      where: { asset: assetWhere },
      include: {
        asset: { include: { assetType: true } },
        borrower: true,
        returnTicket: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const [pendingTickets, archivedTickets] = await Promise.all([
    prisma.returnTicket
      ? prisma.returnTicket.findMany({
          where: { tenantId, status: "PENDING_APPROVAL" },
          include: {
            asset: { include: { assetType: true } },
            checkout: { include: { borrower: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    prisma.returnTicket
      ? prisma.returnTicket.findMany({
          where: { tenantId, status: "ARCHIVED" },
          include: {
            asset: { include: { assetType: true } },
            checkout: { include: { borrower: true } },
            approver: true,
          },
          orderBy: { resolvedAt: "desc" },
          take: 50,
        })
      : [],
  ]);

  const canApprove = hasCapability(role, "tickets:approve");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-0)]">
            Raise and manage tool requests
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-0.5">
            Request tools, track status, and manage returns. Approvers approve or reject returns.
          </p>
        </div>
        <Button asChild className="bg-[var(--brand-dark-blue)] hover:opacity-90">
          <a href="#raise-ticket">+ Raise Ticket</a>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Pending approval</p>
          <p className="text-2xl font-bold text-[var(--status-maintenance)]">{pendingTickets.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Overdue checkouts</p>
          <p className="text-2xl font-bold text-[var(--status-issued)]">{overdueCheckouts.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
          <p className="text-sm text-[var(--text-2)]">Closed (archived)</p>
          <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{archivedTickets.length}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-0)] mb-3">Ticket list</h2>
        <TicketListTable checkouts={recentCheckouts} />
      </section>

      {canApprove && (
        <TicketBoard
          pendingTickets={pendingTickets}
          archivedTickets={archivedTickets}
          canApprove={true}
        />
      )}

      {showOverdue && <OverdueList checkouts={overdueCheckouts} />}
      {overdueCheckouts.length > 0 && !showOverdue && (
        <Button variant="secondary" asChild>
          <Link href="/checkout?filter=overdue">View overdue checkouts ({overdueCheckouts.length})</Link>
        </Button>
      )}

      <section id="raise-ticket">
        <h2 className="text-lg font-semibold text-[var(--text-0)] mb-3">Raise Ticket</h2>
        <CheckoutForm
          asset={asset}
          availableAssets={availableAssets}
          pools={pools}
          userId={userId}
          tenantId={tenantId}
          role={role}
        />
      </section>
    </div>
  );
}
