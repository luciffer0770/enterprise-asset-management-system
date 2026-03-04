import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const status = req.nextUrl.searchParams.get("status");

  const where: { tenantId: string; status?: string } = { tenantId };
  if (status) where.status = status;

  const tickets = await prisma.returnTicket.findMany({
    where,
    include: {
      asset: { include: { assetType: true } },
      checkout: { include: { borrower: true } },
      approver: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ tickets });
}
