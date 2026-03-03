import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { readFile } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "calibration");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability((session.user as { role?: string }).role ?? "", "calibration:read")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cal = await prisma.calibrationEvent.findUnique({
    where: { id },
    include: { asset: true },
  });

  if (!cal?.certificateUrl) {
    return NextResponse.json({ message: "No certificate" }, { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, cal.certificateUrl);
  try {
    const buf = await readFile(filePath);
    const ext = path.extname(cal.certificateUrl).toLowerCase();
    const mime = ext === ".pdf" ? "application/pdf" : "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="cal-${cal.asset.assetTag}-cert${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}

export async function POST(
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
  const cal = await prisma.calibrationEvent.findUnique({
    where: { id },
    include: { asset: true },
  });

  if (!cal) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ message: "No file" }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".pdf";
  const fileName = `${id}${ext}`;
  const { mkdir, writeFile } = await import("fs/promises");

  await mkdir(UPLOADS_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, fileName), buf);

  await prisma.calibrationEvent.update({
    where: { id },
    data: { certificateUrl: fileName },
  });

  return NextResponse.json({ ok: true, fileName });
}
