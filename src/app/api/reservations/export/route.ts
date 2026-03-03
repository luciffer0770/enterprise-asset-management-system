import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

function fmt(d: Date) {
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "reservations")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const start = new Date(month + "-01");
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const reservations = await prisma.reservation.findMany({
    where: {
      requester: { tenantId },
      startDate: { lt: end },
      endDate: { gt: start },
    },
    include: {
      asset: { include: { assetType: true, project: true } },
      requester: true,
    },
    orderBy: { startDate: "asc" },
  });

  const headers = ["Reservation ID", "Tool", "Project", "Reserved By", "Start", "End", "Status", "Priority"];
  const rows = reservations.map((r) => [
    `RESV-${r.id.slice(-6).toUpperCase()}`,
    r.asset?.assetTag ?? "",
    r.asset?.project?.name ?? "",
    r.requester.displayName,
    fmt(new Date(r.startDate)),
    fmt(new Date(r.endDate)),
    r.status,
    r.priority,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reservations-${month}.csv"`,
    },
  });
}
