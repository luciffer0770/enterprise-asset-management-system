"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Calendar,
  Wrench,
  FlaskConical,
  DollarSign,
  FileText,
  Menu,
  LogOut,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasCapability } from "@/lib/permissions";
import type { Role } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, cap: "assets:read" as const },
  { href: "/assets", label: "Tools", icon: Package, cap: "assets:read" as const },
  { href: "/trolleys", label: "Trolleys", icon: ShoppingCart, cap: "assets:read" as const },
  { href: "/checkout", label: "Tickets", icon: ClipboardCheck, cap: "checkout" as const },
  { href: "/reservations", label: "Reservations", icon: Calendar, cap: "reservations" as const },
  { href: "/work-orders", label: "Work Orders", icon: Wrench, cap: "workorders:read" as const },
  { href: "/calibration", label: "Calibration", icon: FlaskConical, cap: "calibration:read" as const },
  { href: "/finance", label: "Depreciation", icon: DollarSign, cap: "finance:read" as const },
  { href: "/audit-logs", label: "Audit Logs", icon: FileText, cap: "audit:read" as const },
];

export function AppShell({
  children,
  role,
  tenantName,
}: {
  children: React.ReactNode;
  role: Role | string;
  tenantName: string;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => hasCapability(role, item.cap));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--surface-1)]">
      {/* Bosch-style: red bar + supergraphic gradient band */}
      <div className="hidden md:block h-1 w-full bg-[var(--header-red-bar)] fixed top-0 left-0 right-0 z-50" aria-hidden />
      <div
        className="hidden md:block h-1 w-full fixed top-1 left-0 right-0 z-50 opacity-90"
        style={{ background: "var(--supergraphic)" }}
        aria-hidden
      />

      {/* Desktop sidebar - dark blue Bosch-style */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-60 border-r border-[var(--brand-dark-blue)] bg-[var(--brand-sidebar)]",
          "fixed left-0 top-[8px] bottom-0 z-40"
        )}
      >
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--brand-dark-blue)] font-bold text-sm">
            T
          </div>
          <span className="ml-3 font-semibold text-sm text-white">Tool Management</span>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav overlay */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 bottom-0 w-60 bg-[var(--brand-sidebar)] border-r border-white/10 z-50 transition-transform",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-white/10">
          <span className="font-semibold text-white">Tool Management</span>
        </div>
        <nav className="p-3">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setNavOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-white/90",
                pathname === item.href ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col md:ml-60 min-h-screen pt-1">
        {/* Top bar - white with search and user */}
        <header className="h-14 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-[var(--border)] bg-[var(--surface-0)] sticky top-2 z-30 shadow-sm">
          <button
            onClick={() => setNavOpen((o) => !o)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--surface-2)]"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-0)] truncate">
            {tenantName}
          </h1>
          <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
            <div className="hidden sm:block relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Search tools..."
                className="pl-8 h-9 bg-[var(--surface-1)] border-[var(--border)]"
              />
            </div>
            {hasCapability(role, "switch-role") && (
              <Link href="/switch-role">
                <Button variant="ghost" size="sm">
                  Switch Role
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 bg-[var(--surface-0)] border-t border-[var(--border)] z-30">
          <Link
            href="/dashboard"
            className="flex flex-col items-center text-xs text-[var(--text-1)]"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <LayoutDashboard className="h-5 w-5 mb-1" />
            Dashboard
          </Link>
          <Link href="/assets" className="flex flex-col items-center text-xs text-[var(--text-1)]">
            <Package className="h-5 w-5 mb-1" />
            Tools
          </Link>
          <Link href="/checkout" className="flex flex-col items-center text-xs text-[var(--text-1)]">
            <ClipboardCheck className="h-5 w-5 mb-1" />
            Tickets
          </Link>
          <Link href="/work-orders" className="flex flex-col items-center text-xs text-[var(--text-1)]">
            <Wrench className="h-5 w-5 mb-1" />
            Work Orders
          </Link>
        </nav>
      </main>
    </div>
  );
}
