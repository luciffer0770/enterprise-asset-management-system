import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  certificateUrl: z.string().min(1).optional(),
  result: z.enum(["PASS", "FAIL", "OOT"]).optional(),
  performedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";

  if (!hasCapability(role, "calibration:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await _req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.calibrationEvent.findFirst({
    where: { id, asset: { tenantId } },
    include: { asset: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update: {
    certificateUrl?: string;
    result?: string;
    performedDate?: Date;
    nextDueDate?: Date;
    notes?: string;
  } = {};
  if (body.certificateUrl !== undefined) update.certificateUrl = body.certificateUrl;
  if (body.result !== undefined) update.result = body.result;
  if (body.performedDate !== undefined) update.performedDate = new Date(body.performedDate);
  if (body.nextDueDate !== undefined) update.nextDueDate = new Date(body.nextDueDate);
  if (body.notes !== undefined) update.notes = body.notes;

  const updated = await prisma.calibrationEvent.update({
    where: { id },
    data: update,
    include: { asset: { include: { assetType: true } } },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "CalibrationEvent",
    entityId: id,
    action: "UPDATE",
    diff: { certificateUrl: body.certificateUrl, result: body.result },
  });

  return NextResponse.json(updated);
}
