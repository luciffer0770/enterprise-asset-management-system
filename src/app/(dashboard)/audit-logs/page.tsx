import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { AuditLogTable } from "./audit-log-table";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>;
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
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const params = await searchParams;

  const where: { tenantId: string; entityType?: string; action?: string; actorUserId?: string } = {
    tenantId,
  };
  if (params.entityType) where.entityType = params.entityType;
  if (params.action) where.action = params.action;
  // Admin only - EXTERNAL and others don't have audit:read

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

      <AuditLogTable events={events} />
    </div>
  );
}
