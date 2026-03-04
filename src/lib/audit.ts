import { prisma } from "./db";

export async function logAudit(params: {
  tenantId: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  diff?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await prisma.auditLogEvent.create({
    data: {
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      diffJson: JSON.stringify(params.diff ?? {}),
      ipAddress: params.ipAddress,
    },
  });
}
