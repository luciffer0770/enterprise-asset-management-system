import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { EditTrolleyForm } from "./edit-trolley-form";

export default async function EditTrolleyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "trolleys")) {
    return <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>;
  }

  const { id } = await params;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";

  const trolley = await prisma.trolley.findFirst({
    where: { id, tenantId },
    include: { project: true },
  });

  if (!trolley) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Trolley</h1>
      <p className="text-sm text-[var(--text-2)]">
        Edit trolley details. You can assign/remove tools on the trolley detail page.
      </p>
      <EditTrolleyForm trolley={trolley} />
    </div>
  );
}
