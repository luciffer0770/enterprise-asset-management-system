import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Only Admin can change work order status" }, { status: 403 });
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

  const prevStatus = wo.status;
  await prisma.workOrder.update({
    where: { id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "WorkOrder",
    entityId: id,
    action: "UPDATE",
    diff: { status: { from: prevStatus, to: parsed.data.status } },
  });

  return NextResponse.json({ ok: true });
}
