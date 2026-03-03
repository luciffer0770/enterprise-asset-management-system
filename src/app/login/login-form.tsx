"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Lock, LogIn } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid employee ID or password.",
  Default: "Sign in failed. Please try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authError = searchParams.get("error");
  const authErrorMsg = authError ? (ERROR_MESSAGES[authError] ?? ERROR_MESSAGES.Default) : null;

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
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <p className="text-red-600">{error}</p>
        <a href="/login" className="ml-2 text-blue-600 hover:underline">Retry</a>
      </div>
    );
  }

  if (!csrfToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Abstract geometric background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-red-200/40 blur-3xl" />
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-56 h-56 rounded-full bg-emerald-200/40 blur-3xl" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rotate-12 bg-red-100/50 rounded-2xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 -rotate-6 bg-blue-100/50 rounded-2xl" />
        <div className="absolute bottom-1/3 left-1/2 w-20 h-20 rotate-45 bg-emerald-100/50 rounded-xl" />
      </div>

      {/* Right: Login panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg p-8">
            <h1 className="text-xl font-semibold text-gray-900 text-center">
              Material & Tool Lifecycle Management System
            </h1>
            <p className="text-sm text-gray-500 text-center mt-2">Sign in to your account</p>

            {authErrorMsg && (
              <p className="mt-4 text-sm text-red-600 text-center" role="alert">{authErrorMsg}</p>
            )}

            <form
              method="post"
              action="/api/auth/callback/credentials"
              className="mt-6 space-y-4"
            >
              <input name="csrfToken" type="hidden" value={csrfToken} />
              <input name="callbackUrl" type="hidden" value="/dashboard" />

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Forgot password? Contact your administrator.
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">Quick sign in (demo):</p>
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
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {role}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
