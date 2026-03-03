import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { TicketsClient, type TicketRow } from "./tickets-client";

function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : null;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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
      take: 300,
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
      take: 300,
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
      take: 300,
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

  const tickets: TicketRow[] = [];

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
      assetId: ir.assetId,
    });
  }

  for (const c of checkouts) {
    if (c.returnedAt) continue;
    if (c.returnTicket?.status === "PENDING_APPROVAL") continue;
    const isOverdue = c.dueDate && c.dueDate < now;
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
      status: isOverdue ? "OVERDUE" : "ISSUED",
      purpose: c.reason ?? undefined,
      issueDate: fmt(c.checkedOutAt) ?? "—",
      condition: c.conditionOut ?? "Good",
      assetId: c.assetId,
    });
  }

  for (const rt of returnTickets) {
    const c = rt.checkout;
    const isPending = rt.status === "PENDING_APPROVAL";
    const isClosed = ["APPROVED", "CLOSED"].includes(rt.status);
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

  tickets.sort((a, b) => {
    const da = a.issueDate ?? "";
    const db = b.issueDate ?? "";
    return db.localeCompare(da);
  });

  const overdueCount = checkouts.filter((c) => !c.returnedAt && c.dueDate && c.dueDate < now).length;
  const pendingIssueCount = issueRequests.filter((ir) => ir.status === "PENDING_APPROVAL").length;
  const pendingReturnCount = returnTickets.filter((rt) => rt.status === "PENDING_APPROVAL").length;
  const activeCount = checkouts.filter((c) => !c.returnedAt).length;
  const openCount = activeCount + pendingIssueCount + pendingReturnCount;
  const resolvedThisMonth = returnTickets.filter(
    (rt) => ["APPROVED", "CLOSED"].includes(rt.status) && rt.closedAt && rt.closedAt >= monthStart
  ).length;

  const typeData = [
    { name: "Issue Request", value: tickets.filter((t) => t.type === "issue_request").length },
    { name: "Checkout", value: tickets.filter((t) => t.type === "checkout").length },
    { name: "Return", value: tickets.filter((t) => t.type === "return_ticket").length },
  ].filter((d) => d.value > 0);
  if (typeData.length === 0) typeData.push({ name: "No data", value: 1 });

  const statusData = [
    { name: "Pending", value: tickets.filter((t) => t.status === "PENDING").length, color: "#f59e0b" },
    { name: "Issued", value: tickets.filter((t) => t.status === "ISSUED").length, color: "#8b5cf6" },
    { name: "Overdue", value: tickets.filter((t) => t.status === "OVERDUE").length, color: "#ef4444" },
    { name: "Closed", value: tickets.filter((t) => t.status === "CLOSED").length, color: "#10b981" },
  ].filter((s) => s.value > 0);
  if (statusData.length === 0) statusData.push({ name: "No data", value: 1, color: "#94a3b8" });

  const requestedAssetIds = new Set(
    issueRequests.filter((ir) => ir.status === "PENDING_APPROVAL").map((ir) => ir.assetId)
  );
  const availableAssets = inServiceAssets.filter((a) => !requestedAssetIds.has(a.id));

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize ?? "20", 10) || 20));

  return (
    <TicketsClient
      tickets={tickets}
      kpis={{
        open: openCount,
        pending: pendingIssueCount + pendingReturnCount,
        overdue: overdueCount,
        resolvedMonth: resolvedThisMonth,
        highPriority: overdueCount,
      }}
      typeData={typeData}
      statusData={statusData}
      availableAssets={availableAssets}
      trolleys={trolleys}
      canApprove={hasCapability(role, "tickets:approve")}
      canReturn={hasCapability(role, "checkout")}
      canClose={role === "ADMIN"}
      canCreateWO={hasCapability(role, "workorders:write")}
      role={role}
      totalCount={tickets.length}
      page={page}
      pageSize={pageSize}
      params={params as Record<string, string | undefined>}
    />
  );
}
