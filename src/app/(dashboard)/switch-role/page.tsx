"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasCapability } from "@/lib/permissions";

const ROLES = [
  { id: "ADMIN", label: "Admin", desc: "Full access" },
  { id: "MECHANICAL", label: "Mechanical", desc: "Mechanical org unit" },
  { id: "ELECTRICAL", label: "Electrical", desc: "Electrical org unit" },
  { id: "EXTERNAL", label: "External", desc: "Assigned assets only" },
];

export default function SwitchRolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <div className="p-8">Loading…</div>;
  }

  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "switch-role")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        Only admins can switch roles. Use the demo accounts to test different roles.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Switch Role (Demo)</h1>
      <p className="text-sm text-[var(--text-2)]">
        This is a demo-only feature. To test different roles, sign out and sign
        in with the corresponding demo account.
      </p>

      <div className="grid gap-4">
        {ROLES.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{r.label}</CardTitle>
              {role === r.id && (
                <span className="text-sm text-[var(--brand-dark-blue)] font-medium">
                  Current
                </span>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-2)] mb-4">{r.desc}</p>
              <p className="text-xs text-[var(--text-muted)]">
                Demo: {r.id.toLowerCase()}@demo.com / demo123
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="secondary" onClick={() => router.push("/dashboard")}>
        Back to Dashboard
      </Button>
    </div>
  );
}
