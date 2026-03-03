import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  assignedToId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { hasCapability } = await import("@/lib/permissions");
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasCapability(role, "workorders:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const wo = await prisma.workOrder.findFirst({
    where: { id, asset: { tenantId } },
    include: { asset: true },
  });

  if (!wo) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const data: { status?: string; completedAt?: Date | null; assignedToId?: string | null } = {};
  if (parsed.data.status) {
    if (role !== "ADMIN") {
      return NextResponse.json({ message: "Only Admin can change status" }, { status: 403 });
    }
    data.status = parsed.data.status;
    data.completedAt = parsed.data.status === "COMPLETED" ? new Date() : null;
  }
  if (parsed.data.assignedToId !== undefined) {
    data.assignedToId = parsed.data.assignedToId || null;
  }

  const prevStatus = wo.status;
  await prisma.workOrder.update({
    where: { id },
    data,
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "WorkOrder",
    entityId: id,
    action: "UPDATE",
    diff: { ...(parsed.data.status && { status: { from: prevStatus, to: parsed.data.status } }), ...(parsed.data.assignedToId !== undefined && { assignedToId: parsed.data.assignedToId }) },
  });

  return NextResponse.json({ ok: true });
}
