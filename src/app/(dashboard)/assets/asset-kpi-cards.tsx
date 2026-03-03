"use client";

import Link from "next/link";

type KPICardProps = {
  label: string;
  value: number;
  total: number;
  color: string;
  barColor: string;
  href?: string;
};

export function AssetKPICards({ kpis }: { kpis: KPICardProps[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <Link key={k.label} href={k.href ?? "#"} className="block">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors h-full">
            <p className="text-sm text-[var(--text-2)]">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value.toLocaleString()}</p>
            <div className="mt-2 h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${k.barColor}`}
                style={{ width: k.total > 0 ? `${Math.min(100, (k.value / k.total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
