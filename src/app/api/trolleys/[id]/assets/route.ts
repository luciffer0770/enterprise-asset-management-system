import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

const assignSchema = z.object({ assetId: z.string() });

export async function POST(
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

  const { id: trolleyId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const trolley = await prisma.trolley.findFirst({ where: { id: trolleyId, tenantId } });
  if (!trolley) return NextResponse.json({ message: "Trolley not found" }, { status: 404 });

  const asset = await prisma.asset.findFirst({
    where: {
      id: parsed.data.assetId,
      tenantId,
      lifecycleState: "IN_SERVICE",
      trolleyId: null,
    },
  });
  if (!asset) {
    return NextResponse.json(
      { message: "Asset not found or not available (must be IN_SERVICE and not on another trolley)" },
      { status: 404 }
    );
  }

  await prisma.asset.update({
    where: { id: asset.id },
    data: { trolleyId },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Asset",
    entityId: asset.id,
    action: "UPDATE",
    diff: { assetTag: asset.assetTag, trolleyId, trolleyCode: trolley.trolleyCode },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { id: trolleyId } = await params;
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json({ message: "assetId required" }, { status: 400 });
  }

  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session.user as { id?: string })?.id ?? "";

  const trolley = await prisma.trolley.findFirst({ where: { id: trolleyId, tenantId } });
  if (!trolley) return NextResponse.json({ message: "Trolley not found" }, { status: 404 });

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, tenantId, trolleyId },
  });
  if (!asset) return NextResponse.json({ message: "Asset not on this trolley" }, { status: 404 });

  await prisma.asset.update({
    where: { id: asset.id },
    data: { trolleyId: null },
  });

  await logAudit({
    tenantId,
    actorUserId: userId,
    entityType: "Asset",
    entityId: asset.id,
    action: "UPDATE",
    diff: { assetTag: asset.assetTag, trolleyId: null, unassignedFrom: trolley.trolleyCode },
  });

  return NextResponse.json({ ok: true });
}
