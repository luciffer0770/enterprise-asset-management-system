import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import * as XLSX from "xlsx";
import { z } from "zod";

const rowSchema = z.object({
  "Tool Code": z.string().min(1),
  "Serial Number": z.string().optional(),
  Type: z.string().optional(),
  Category: z.string().optional(),
  Status: z.string().optional(),
  "Org Unit": z.string().optional(),
  Location: z.string().optional(),
  Trolley: z.string().optional(),
  Condition: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "EXTERNAL", "assets:write")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const [assetType] = await prisma.assetType.findMany({
    where: { tenantId },
    take: 1,
  });
  if (!assetType) {
    return NextResponse.json({ message: "No asset type configured" }, { status: 400 });
  }

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push(`Row ${i + 2}: Invalid data`);
      continue;
    }
    const r = parsed.data;
    const tag = String(r["Tool Code"]).trim();
    if (!tag) continue;

    const existing = await prisma.asset.findFirst({
      where: { tenantId, assetTag: tag },
    });
    if (existing) {
      errors.push(`Row ${i + 2}: Tag ${tag} already exists`);
      continue;
    }

    let trolleyId: string | null = null;
    if (r.Trolley) {
      const match = r.Trolley.match(/^([A-Z]+-\d+)/);
      if (match) {
        const t = await prisma.trolley.findFirst({
          where: { tenantId, trolleyCode: match[1] },
        });
        if (t) trolleyId = t.id;
      }
    }

    try {
      await prisma.asset.create({
        data: {
          tenantId,
          assetTypeId: assetType.id,
          assetTag: tag,
          serialNumber: r["Serial Number"] ?? null,
          lifecycleState: r.Status ?? "IN_SERVICE",
          status: r.Status ?? "IN_SERVICE",
          condition: r.Condition ?? "GOOD",
          locationPath: r.Location ?? null,
          trolleyId,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Row ${i + 2}: ${String(e)}`);
    }
  }

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Asset",
    entityId: "",
    action: "IMPORT",
    diff: { created, errors: errors.length },
  });

  return NextResponse.json({ ok: true, created, errors: errors.slice(0, 10) });
}
