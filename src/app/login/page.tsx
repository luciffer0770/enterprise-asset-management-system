import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--text-2)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
