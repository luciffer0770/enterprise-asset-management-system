import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { TENANT_NAME } from "@/lib/utils";

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
  return (
    <AppShell role={role} tenantName={TENANT_NAME}>
      {children}
    </AppShell>
  );
}
