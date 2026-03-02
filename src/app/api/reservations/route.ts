import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "reservations")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { assetId, startDate, endDate } = parsed.data;
  const userId = (session.user as { id?: string }).id ?? "";
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, tenantId },
  });
  if (!asset) {
    return NextResponse.json({ message: "Asset not found" }, { status: 404 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const conflict = await prisma.reservation.findFirst({
    where: {
      assetId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { message: "Asset already reserved for this period" },
      { status: 409 }
    );
  }

  const res = await prisma.reservation.create({
    data: {
      assetId,
      requesterId: userId,
      startDate: start,
      endDate: end,
      status: "CONFIRMED",
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Reservation",
    entityId: res.id,
    action: "CREATE",
    diff: { assetTag: asset.assetTag, startDate, endDate },
  });

  return NextResponse.json({ ok: true, id: res.id });
}
