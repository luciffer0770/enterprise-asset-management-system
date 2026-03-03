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

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Add New Trolley</h1>
      <p className="text-sm text-[var(--text-2)]">
        Enter trolley code and project name. Trolleys are shared by Mechanical and Electrical.
      </p>
      <NewTrolleyForm />
    </div>
  );
}
