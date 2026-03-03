import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuditClient } from "./audit-client";
import { hasCapability } from "@/lib/permissions";

const HIGH_RISK_ACTIONS = ["DELETE", "TICKET_REJECTED", "REJECT"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
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
  const params = await searchParams;
  const userFilter = params.user;
  const moduleFilter = params.module;
  const actionFilter = params.action;
  const riskFilter = params.risk;
  const q = params.q;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize ?? "20", 10) || 20));
  const skip = (page - 1) * pageSize;

  const riskActionWhere =
    !actionFilter && riskFilter === "High"
      ? { action: { in: HIGH_RISK_ACTIONS } }
      : !actionFilter && riskFilter === "Medium"
        ? { action: { in: ["UPDATE", "CLOSE", "TICKET_APPROVED", "APPROVE"] } }
        : !actionFilter && riskFilter === "Low"
          ? { action: { in: ["CREATE", "CHECKOUT", "RETURN", "IMPORT"] } }
          : {};

  const where = {
    tenantId,
    ...(moduleFilter && { entityType: moduleFilter }),
    ...(actionFilter ? { action: actionFilter } : riskActionWhere),
    ...(userFilter && {
      actor: { displayName: userFilter },
    }),
    ...(q && {
      OR: [
        { entityId: { contains: q } },
        { entityType: { contains: q } },
        { diffJson: { contains: q } },
      ],
    }),
  };

  const [events, totalCount, totalAll, criticalCount, assetCount, highRiskCount, recentAll] = await Promise.all([
    prisma.auditLogEvent.findMany({
      where,
      include: { actor: { select: { displayName: true, role: true } } },
      orderBy: { eventTs: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLogEvent.count({ where }),
    prisma.auditLogEvent.count({ where: { tenantId } }),
    prisma.auditLogEvent.count({
      where: { tenantId, action: { in: HIGH_RISK_ACTIONS } },
    }),
    prisma.auditLogEvent.count({
      where: { tenantId, entityType: "Asset" },
    }),
    prisma.auditLogEvent.count({
      where: { tenantId, action: { in: HIGH_RISK_ACTIONS } },
    }),
    prisma.auditLogEvent.findMany({
      where: { tenantId, eventTs: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { eventTs: true, entityType: true, action: true },
    }),
  ]);

  const now = new Date();
  const trendByDate = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    trendByDate.set(key, 0);
  }
  for (const e of recentAll) {
    const d = new Date(e.eventTs);
    const key = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (trendByDate.has(key)) {
      trendByDate.set(key, (trendByDate.get(key) ?? 0) + 1);
    }
  }
  const trendData = Array.from(trendByDate.entries()).map(([date, count]) => ({ date, count }));

  const moduleCounts = new Map<string, number>();
  for (const e of recentAll) {
    const t = e.entityType;
    moduleCounts.set(t, (moduleCounts.get(t) ?? 0) + 1);
  }
  const moduleData = Array.from(moduleCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  for (const e of recentAll) {
    if (HIGH_RISK_ACTIONS.includes(e.action)) riskCounts.High += 1;
    else if (["UPDATE", "CLOSE", "TICKET_APPROVED", "APPROVE"].includes(e.action)) riskCounts.Medium += 1;
    else riskCounts.Low += 1;
  }
  const riskData = [
    { name: "Low", value: riskCounts.Low, color: "#10b981" },
    { name: "Medium", value: riskCounts.Medium, color: "#f59e0b" },
    { name: "High", value: riskCounts.High, color: "#ef4444" },
  ].filter((s) => s.value > 0);
  if (riskData.length === 0) riskData.push({ name: "No data", value: 1, color: "#94a3b8" });

  const distinctUsers = await prisma.user.findMany({
    where: {
      tenantId,
      auditLogs: { some: {} },
    },
    select: { displayName: true },
    take: 50,
  });

  return (
    <AuditClient
      users={distinctUsers.map((u) => u.displayName)}
      events={events.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        entityId: e.entityId,
        action: e.action,
        eventTs: e.eventTs,
        diffJson: e.diffJson,
        ipAddress: e.ipAddress,
        actor: e.actor,
      }))}
      kpis={{
        total: totalAll,
        critical: criticalCount,
        assetChanges: assetCount,
        pendingCompliance: highRiskCount,
      }}
      trendData={trendData}
      moduleData={moduleData}
      riskData={riskData}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      params={params as Record<string, string | undefined>}
    />
  );
}
