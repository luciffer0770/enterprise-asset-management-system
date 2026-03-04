import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  projectId: z.string().optional(),
  kind: z.string().optional(), // Mechanical, Electrical
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, tenantId },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const pool = await prisma.inventoryPool.create({
    data: {
      tenantId,
      name: body.name,
      code: body.code?.trim() || null,
      projectId: body.projectId || null,
      kind: body.kind || null,
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "InventoryPool",
    entityId: pool.id,
    action: "CREATE",
    diff: { name: pool.name, code: pool.code },
  });

  return NextResponse.json(pool);
}
