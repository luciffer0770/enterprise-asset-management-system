import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { NewTrolleyForm } from "./new-trolley-form";

export default async function NewTrolleyPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "assets:write")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">You do not have permission.</div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const projects = await prisma.project.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Add Trolley</h1>
      <NewTrolleyForm projects={projects} />
    </div>
  );
}
