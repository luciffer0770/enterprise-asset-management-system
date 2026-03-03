import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { TENANT_NAME } from "@/lib/utils";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role ?? "EXTERNAL";
  const tenantId = (session.user as { tenantId?: string })?.tenantId ?? "";

  const [woCount, ticketCount] = await Promise.all([
    prisma.workOrder.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        asset: { tenantId },
      },
    }),
    prisma.returnTicket.count({
      where: {
        status: "PENDING_APPROVAL",
        checkout: { asset: { tenantId } },
      },
    }),
  ]).catch(() => [0, 0]);

  return (
    <AppShell
      role={role}
      tenantName={TENANT_NAME}
      workOrderBadge={woCount}
      ticketBadge={ticketCount}
    >
      {children}
    </AppShell>
  );
}
