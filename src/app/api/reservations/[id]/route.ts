import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "reservations")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const res = await prisma.reservation.findFirst({
    where: { id, requester: { tenantId } },
    include: { asset: true },
  });

  if (!res) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const data: { status?: string; startDate?: Date; endDate?: Date } = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.startDate) data.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);

  await prisma.reservation.update({
    where: { id },
    data,
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Reservation",
    entityId: id,
    action: "UPDATE",
    diff: { assetTag: res.asset?.assetTag, ...data },
  });

  return NextResponse.json({ ok: true });
}
