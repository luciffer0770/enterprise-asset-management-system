import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  trolleyCode: z.string().min(1),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  department: z.enum(["Mechanical", "Electrical"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "trolleys")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  let projectId = parsed.data.projectId;
  if (!projectId && parsed.data.projectName) {
    const proj = await prisma.project.create({
      data: { tenantId, name: parsed.data.projectName.trim() },
    });
    projectId = proj.id;
  }
  if (!projectId) {
    return NextResponse.json({ message: "Project required" }, { status: 400 });
  }

  const existing = await prisma.trolley.findFirst({
    where: { tenantId, trolleyCode: parsed.data.trolleyCode.trim() },
  });
  if (existing) {
    return NextResponse.json({ message: "Trolley code already exists" }, { status: 409 });
  }

  const trolley = await prisma.trolley.create({
    data: {
      tenantId,
      projectId,
      trolleyCode: parsed.data.trolleyCode.trim(),
      department: parsed.data.department,
    },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Trolley",
    entityId: trolley.id,
    action: "CREATE",
    diff: { trolleyCode: trolley.trolleyCode, projectId, department: trolley.department },
  });

  return NextResponse.json({ ok: true, id: trolley.id });
}
