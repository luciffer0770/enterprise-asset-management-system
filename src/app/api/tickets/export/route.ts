import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "checkout")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const now = new Date();

  const [issueRequests, checkouts, returnTickets] = await Promise.all([
    prisma.issueRequest.findMany({
      where: { asset: { tenantId } },
      include: {
        asset: { include: { assetType: true, ownerOrgUnit: true } },
        trolley: { include: { project: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
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
      take: 2000,
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
      take: 2000,
    }),
  ]);

  const rows: string[][] = [];

  for (const ir of issueRequests) {
    rows.push([
      `REQ-${ir.id.slice(-6).toUpperCase()}`,
      "Issue Request",
      ir.asset.assetTag,
      ir.trolley?.project?.name ?? ir.asset.ownerOrgUnit?.name ?? "—",
      ir.borrowerName,
      ir.status === "PENDING_APPROVAL" ? "PENDING" : ir.status === "APPROVED" ? "APPROVED" : "CLOSED",
      fmt(ir.dueDate) ?? "",
      fmt(ir.createdAt) ?? "",
      ir.reason,
    ]);
  }

  for (const c of checkouts) {
    if (c.returnedAt) continue;
    if (c.returnTicket?.status === "PENDING_APPROVAL") continue;
    const isOverdue = c.dueDate && c.dueDate < now;
    rows.push([
      `ISS-${c.id.slice(-6).toUpperCase()}`,
      "Checkout",
      c.asset.assetTag,
      c.trolley?.project?.name ?? c.asset.ownerOrgUnit?.name ?? "—",
      c.borrowerName ?? c.borrower.displayName,
      isOverdue ? "OVERDUE" : "ISSUED",
      fmt(c.dueDate) ?? "",
      fmt(c.checkedOutAt) ?? "",
      c.reason ?? "",
    ]);
  }

  for (const rt of returnTickets) {
    const c = rt.checkout;
    const isPending = rt.status === "PENDING_APPROVAL";
    const isClosed = ["APPROVED", "CLOSED"].includes(rt.status);
    if (!isPending && !isClosed) continue;
    rows.push([
      `RET-${rt.id.slice(-6).toUpperCase()}`,
      "Return",
      c.asset.assetTag,
      c.trolley?.project?.name ?? c.asset.ownerOrgUnit?.name ?? "—",
      rt.raisedBy.displayName,
      isPending ? "PENDING" : "CLOSED",
      fmt(c.dueDate) ?? "",
      fmt(rt.createdAt) ?? "",
      "Return",
    ]);
  }

  const headers = ["Ticket ID", "Type", "Asset", "Project", "Reported By", "Status", "Expected Return", "Issue Date", "Purpose"];
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
