import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { AuditLogTable } from "./audit-log-table";
import { AuditLogFilter } from "./audit-log-filter";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    entityType?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "audit:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view audit logs.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";

  const params = await searchParams;

  const where: {
    tenantId: string;
    entityType?: string;
    action?: string;
    actorUserId?: string;
    eventTs?: { gte?: Date; lte?: Date };
  } = { tenantId };
  if (params.entityType) where.entityType = params.entityType;
  if (params.action) where.action = params.action;
  if (role === "EXTERNAL") where.actorUserId = userId;
  if (params.fromDate || params.toDate) {
    where.eventTs = {};
    if (params.fromDate) where.eventTs.gte = new Date(params.fromDate);
    if (params.toDate) {
      const to = new Date(params.toDate);
      to.setHours(23, 59, 59, 999);
      where.eventTs.lte = to;
    }
  }

  const events = await prisma.auditLogEvent.findMany({
    where,
    include: { actor: true },
    orderBy: { eventTs: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <p className="text-sm text-[var(--text-2)]">
        Immutable event log. All privileged actions are recorded.
      </p>

      <AuditLogFilter
        entityType={params.entityType}
        action={params.action}
        fromDate={params.fromDate}
        toDate={params.toDate}
      />

      <AuditLogTable events={events} />
    </div>
  );
}

