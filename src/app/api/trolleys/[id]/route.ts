import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().optional(),
  department: z.enum(["Mechanical", "Electrical"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "trolleys")) {
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
  const role = (session.user as { role?: string })?.role ?? "";

  const trolley = await prisma.trolley.findFirst({
    where: { id, tenantId },
    include: { project: true },
  });

  if (!trolley) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.projectId != null) updates.projectId = parsed.data.projectId;
  if (parsed.data.department != null) updates.department = parsed.data.department;
  if (parsed.data.status != null) updates.status = parsed.data.status;

  await prisma.trolley.update({
    where: { id },
    data: updates,
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Trolley",
    entityId: id,
    action: "UPDATE",
    diff: { trolleyCode: trolley.trolleyCode, ...updates },
  });

  return NextResponse.json({ ok: true });
}
