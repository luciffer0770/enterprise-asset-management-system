import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { TicketsPageClient, type TicketRow } from "./tickets-page-client";

function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : null;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const initialStatus = params.status === "pending" ? "PENDING" : params.status === "active" ? "ISSUED" : params.status === "overdue" ? "OVERDUE" : params.status === "closed" ? "CLOSED" : "all";
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "checkout")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to access tickets.
      </div>
    );
  }

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

  const [
    issueRequests,
    checkouts,
    returnTickets,
    inServiceAssets,
    trolleys,
  ] = await Promise.all([
    prisma.issueRequest.findMany({
      where: { asset: { tenantId } },
      include: {
        asset: { include: { assetType: true, ownerOrgUnit: true } },
        requester: true,
        trolley: { include: { project: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.checkout.findMany({
      where: { asset: { tenantId } },
      include: {
        asset: { include: { assetType: true, ownerOrgUnit: true } },
        borrower: true,
        returnTicket: true,
        trolley: { include: { project: true } },
      },
      orderBy: { checkedOutAt: "desc" },
      take: 200,
    }),
    prisma.returnTicket.findMany({
      where: { checkout: { asset: { tenantId } } },
      include: {
        checkout: {
          include: {
            asset: { include: { assetType: true, ownerOrgUnit: true } },
            borrower: true,
            trolley: { include: { project: true } },
          },
        },
        raisedBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.asset.findMany({
      where: { ...assetWhere, lifecycleState: "IN_SERVICE", trolleyId: null },
      include: { assetType: true },
      take: 200,
    }),
    prisma.trolley.findMany({
      where: { tenantId },
      include: { project: true },
      orderBy: { trolleyCode: "asc" },
    }),
  ]);

  // Build unified ticket list
  const tickets: TicketRow[] = [];

  // Issue requests (pending only for display, we can show approved/rejected too)
  for (const ir of issueRequests) {
    tickets.push({
      id: ir.id,
      type: "issue_request",
      ticketId: `REQ-${ir.id.slice(-6).toUpperCase()}`,
      toolName: ir.asset.assetType.name,
      toolTag: ir.asset.assetTag,
      project: ir.trolley?.project?.name ?? ir.asset.ownerOrgUnit?.name ?? "—",
      raisedBy: ir.borrowerName,
      department: ir.trolley?.department ?? ir.asset.ownerOrgUnit?.name ?? "—",
      expectedReturn: fmt(ir.dueDate),
      status: ir.status === "PENDING_APPROVAL" ? "PENDING" : ir.status === "APPROVED" ? "APPROVED" : "CLOSED",
      purpose: ir.reason,
      issueDate: fmt(ir.createdAt) ?? "—",
      condition: "—",
    });
  }

  // Checkouts (active = issued, overdue = past due) - skip if pending return (we show return ticket row instead)
  for (const c of checkouts) {
    if (c.returnedAt) continue;
    if (c.returnTicket?.status === "PENDING_APPROVAL") continue;
    const isOverdue = c.dueDate && c.dueDate < now;
    const status: TicketRow["status"] = isOverdue ? "OVERDUE" : "ISSUED";
    tickets.push({
      id: c.id,
      type: "checkout",
      ticketId: `ISS-${c.id.slice(-6).toUpperCase()}`,
      toolName: c.asset.assetType.name,
      toolTag: c.asset.assetTag,
      project: c.trolley?.project?.name ?? c.asset.ownerOrgUnit?.name ?? "—",
      raisedBy: c.borrowerName ?? c.borrower.displayName,
      department: c.trolley?.department ?? c.asset.ownerOrgUnit?.name ?? "—",
      expectedReturn: fmt(c.dueDate),
      status,
      purpose: c.reason ?? undefined,
      issueDate: fmt(c.checkedOutAt) ?? "—",
      condition: c.conditionOut ?? "Good",
      assetId: c.assetId,
    });
  }

  // Return tickets (pending and closed)
  for (const rt of returnTickets) {
    const c = rt.checkout;
    const isClosed = ["APPROVED", "CLOSED"].includes(rt.status);
    const isPending = rt.status === "PENDING_APPROVAL";
    if (!isPending && !isClosed) continue;
    tickets.push({
      id: rt.id,
      type: "return_ticket",
      ticketId: `RET-${rt.id.slice(-6).toUpperCase()}`,
      toolName: c.asset.assetType.name,
      toolTag: c.asset.assetTag,
      project: c.trolley?.project?.name ?? c.asset.ownerOrgUnit?.name ?? "—",
      raisedBy: rt.raisedBy.displayName,
      department: c.trolley?.department ?? c.asset.ownerOrgUnit?.name ?? "—",
      expectedReturn: fmt(c.dueDate),
      status: isPending ? "PENDING" : "CLOSED",
      purpose: "Return",
      issueDate: fmt(rt.createdAt) ?? "—",
      condition: c.conditionOut ?? "—",
      returnTicketId: rt.id,
      assetId: c.assetId,
    });
  }

  // Sort by most recent first
  tickets.sort((a, b) => {
    const da = a.issueDate ?? "";
    const db = b.issueDate ?? "";
    return db.localeCompare(da);
  });

  const activeCount = checkouts.filter((c) => !c.returnedAt).length;
  const pendingIssueCount = issueRequests.filter((ir) => ir.status === "PENDING_APPROVAL").length;
  const pendingReturnCount = returnTickets.filter((rt) => rt.status === "PENDING_APPROVAL").length;
  const overdueCount = checkouts.filter(
    (c) => !c.returnedAt && c.dueDate && c.dueDate < now
  ).length;
  const closedTodayCount = returnTickets.filter(
    (rt) =>
      ["APPROVED", "CLOSED"].includes(rt.status) &&
      rt.closedAt &&
      rt.closedAt >= todayStart
  ).length;

  const requestedAssetIds = new Set(
    issueRequests.filter((ir) => ir.status === "PENDING_APPROVAL").map((ir) => ir.assetId)
  );
  const availableAssets = inServiceAssets.filter((a) => !requestedAssetIds.has(a.id));

  return (
    <TicketsPageClient
      initialStatusFilter={initialStatus}
      tickets={tickets}
      kpis={{
        active: activeCount,
        pending: pendingIssueCount + pendingReturnCount,
        issued: activeCount,
        overdue: overdueCount,
        closedToday: closedTodayCount,
      }}
        canApprove={hasCapability(role, "tickets:approve")}
        canReturn={hasCapability(role, "checkout")}
        canClose={role === "ADMIN"}
      availableAssets={availableAssets}
      trolleys={trolleys}
      role={role}
    />
  );
}
