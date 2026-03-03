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
  ShoppingCart,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { hasCapability } from "@/lib/permissions";
import type { Role } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, cap: "assets:read" as const },
  { href: "/assets", label: "Tools", icon: Package, cap: "assets:read" as const },
  { href: "/trolleys", label: "Trolleys", icon: ShoppingCart, cap: "trolleys" as const },
  { href: "/tickets", label: "Tickets", icon: Ticket, cap: "checkout" as const },
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-56 border-r border-[var(--border)] bg-[var(--surface-0)]",
          "fixed left-0 top-0 bottom-0 z-40"
        )}
      >
        <div className="h-12 flex items-center border-b border-[var(--border)] px-4">
          <div className="h-1 w-8 bg-[var(--brand-red)] rounded-full" />
          <span className="ml-3 font-semibold text-sm">Tooling</span>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--brand-dark-blue)] text-white"
                    : "text-[var(--text-1)] hover:bg-[var(--surface-2)]"
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
          "md:hidden fixed left-0 top-0 bottom-0 w-56 bg-[var(--surface-0)] border-r border-[var(--border)] z-50 transition-transform",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <span className="font-semibold">{tenantName}</span>
        </div>
        <nav className="p-2">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setNavOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm",
                pathname === item.href ? "bg-[var(--brand-dark-blue)] text-white" : "text-[var(--text-1)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col md:ml-56 min-h-screen">
        {/* Bosch-style supergraphic band */}
        <div
          className="h-2 w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, var(--brand-red) 0%, var(--brand-dark-blue) 25%, var(--brand-light-blue) 50%, var(--brand-turquoise) 75%, var(--brand-light-green) 100%)",
          }}
        />
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface-0)] sticky top-0 z-30">
          <button
            onClick={() => setNavOpen((o) => !o)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--surface-2)]"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm text-[var(--text-2)] hidden md:inline">{tenantName}</span>
          <div className="flex items-center gap-2">
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
            className="flex flex-col items-center text-xs"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <LayoutDashboard className="h-5 w-5 mb-1" />
            Dashboard
          </Link>
          <Link href="/assets" className="flex flex-col items-center text-xs">
            <Package className="h-5 w-5 mb-1" />
            Tools
          </Link>
          <Link href="/tickets" className="flex flex-col items-center text-xs">
            <Ticket className="h-5 w-5 mb-1" />
            Tickets
          </Link>
          <Link href="/work-orders" className="flex flex-col items-center text-xs">
            <Wrench className="h-5 w-5 mb-1" />
            Work Orders
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center text-xs">
            <Menu className="h-5 w-5 mb-1" />
            More
          </Link>
        </nav>
      </main>
    </div>
  );
}
