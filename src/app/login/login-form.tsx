"use client";

import { useEffect, useState } from "react";
import { TENANT_NAME } from "@/lib/utils";

export function LoginForm() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d?.csrfToken ?? ""))
      .catch((e) => {
        console.error("CSRF fetch failed:", e);
        setError("Could not load form. Check that the app is running and you're using the correct URL.");
      });
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--error)]">{error}</p>
        <a href="/login" className="mt-2 inline-block text-[var(--brand-dark-blue)]">Retry</a>
      </div>
    );
  }

  if (!csrfToken) {
    return (
      <div className="p-6 text-center text-[var(--text-2)]">Loading…</div>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-[var(--surface-1)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-6">
        <div className="h-1 w-16 bg-[var(--brand-red)] rounded-full mb-4" />
        <h1 className="text-xl font-semibold text-[var(--text-0)]">Sign in</h1>
        <p className="text-sm text-[var(--text-1)] mt-1">Tenant: {TENANT_NAME}</p>

        <form
          method="post"
          action="/api/auth/callback/credentials"
          className="mt-6 space-y-4"
        >
          <input name="csrfToken" type="hidden" value={csrfToken} />
          <input name="callbackUrl" type="hidden" value="/dashboard" />

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-1)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="flex h-[36px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm"
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-1)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="flex h-[36px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-[10px] py-2 font-medium text-white bg-[var(--brand-red)] hover:bg-[#c40012]"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-3">Quick sign in (demo):</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: "Admin", email: "admin@demo.com" },
              { role: "Mechanical", email: "mechanical@demo.com" },
              { role: "Electrical", email: "electrical@demo.com" },
              { role: "External", email: "external@demo.com" },
            ].map(({ role, email }) => (
              <form key={email} method="post" action="/api/auth/callback/credentials" className="contents">
                <input name="csrfToken" type="hidden" value={csrfToken} />
                <input name="callbackUrl" type="hidden" value="/dashboard" />
                <input name="email" type="hidden" value={email} />
                <input name="password" type="hidden" value="demo123" />
                <button
                  type="submit"
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                >
                  {role}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
