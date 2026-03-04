import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const { id } = await params;

  const ticket = await prisma.returnTicket.findFirst({
    where: { id, tenantId },
    include: {
      asset: { include: { assetType: true } },
      checkout: { include: { borrower: true } },
      approver: true,
      approvals: { include: { approver: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
