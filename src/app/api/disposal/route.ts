import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  assetId: z.string().min(1),
  method: z.enum(["sale", "scrap", "donate", "transfer"]),
  disposalDate: z.string(),
  proceeds: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";

  if (!hasCapability(role, "finance:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: body.assetId, tenantId },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const existing = await prisma.disposalRecord.findUnique({
    where: { assetId: body.assetId },
  });
  if (existing) {
    return NextResponse.json({ error: "Asset already has a disposal record" }, { status: 400 });
  }

  const disposalDate = new Date(body.disposalDate);
  if (Number.isNaN(disposalDate.getTime())) {
    return NextResponse.json({ error: "Invalid disposal date" }, { status: 400 });
  }

  const record = await prisma.disposalRecord.create({
    data: {
      assetId: body.assetId,
      method: body.method,
      disposalDate,
      proceeds: body.proceeds ?? null,
    },
    include: { asset: { include: { assetType: true } } },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "DisposalRecord",
    entityId: record.id,
    action: "CREATE",
    diff: { assetId: body.assetId, method: body.method, disposalDate: body.disposalDate },
  });

  return NextResponse.json(record);
}
