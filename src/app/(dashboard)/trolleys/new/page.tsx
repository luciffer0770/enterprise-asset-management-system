import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { NewTrolleyForm } from "./new-trolley-form";

export default async function NewTrolleyPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "trolleys")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const projects = await prisma.project.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Add New Trolley</h1>
      <p className="text-sm text-[var(--text-2)]">
        Add a trolley for a new or existing project. Admin, Mechanical, and Electrical can add trolleys.
      </p>
      <NewTrolleyForm projects={projects} tenantId={tenantId} role={role} />
    </div>
  );
}
