import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "audit:read")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const { searchParams } = new URL(req.url);
  const moduleFilter = searchParams.get("module");
  const actionFilter = searchParams.get("action");
  const limit = Math.min(5000, parseInt(searchParams.get("limit") ?? "1000", 10) || 1000);

  const where: { tenantId: string; entityType?: string; action?: string } = { tenantId };
  if (moduleFilter) where.entityType = moduleFilter;
  if (actionFilter) where.action = actionFilter;

  const events = await prisma.auditLogEvent.findMany({
    where,
    include: { actor: { select: { displayName: true, role: true } } },
    orderBy: { eventTs: "desc" },
    take: limit,
  });

  const headers = ["Timestamp", "User", "Role", "Module", "Action", "Object ID", "Details", "IP Address"];
  const rows = events.map((e) => {
    let diff = "{}";
    try {
      diff = e.diffJson;
    } catch {}
    return [
      new Date(e.eventTs).toISOString(),
      e.actor?.displayName ?? "System",
      e.actor?.role ?? "",
      e.entityType,
      e.action,
      e.entityId ?? "",
      diff.replace(/"/g, '""'),
      e.ipAddress ?? "",
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
