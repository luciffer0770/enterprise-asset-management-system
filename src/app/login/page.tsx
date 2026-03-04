"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TENANT_NAME } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-[var(--surface-1)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-6">
        <div className="h-1 w-16 bg-[var(--brand-red)] rounded-full mb-4" />
        <h1 className="text-xl font-semibold text-[var(--text-0)]">Sign in</h1>
        <p className="text-sm text-[var(--text-1)] mt-1">Tenant: {TENANT_NAME}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--error)]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setError("SSO not configured. Use demo credentials.")}
          >
            Sign in with SSO
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-[var(--text-muted)] mb-1">Quick login (demo users):</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("admin@demo.com");
                setPassword("demo123");
              }}
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("lab@demo.com");
                setPassword("demo123");
              }}
            >
              Lab In-Charge
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("mechanical@demo.com");
                setPassword("demo123");
              }}
            >
              Mechanical
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("electrical@demo.com");
                setPassword("demo123");
              }}
            >
              Electrical
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("external@demo.com");
                setPassword("demo123");
              }}
            >
              External
            </Button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Password for all demo users is <code>demo123</code>.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
