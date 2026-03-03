import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  performedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  result: z.enum(["PASS", "FAIL", "OOT"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "calibration:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";

  const cal = await prisma.calibrationEvent.findFirst({
    where: { id, asset: { tenantId } },
  });

  if (!cal) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.performedDate) data.performedDate = new Date(parsed.data.performedDate);
  if (parsed.data.nextDueDate) data.nextDueDate = new Date(parsed.data.nextDueDate);
  if (parsed.data.result) data.result = parsed.data.result;

  await prisma.calibrationEvent.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}
