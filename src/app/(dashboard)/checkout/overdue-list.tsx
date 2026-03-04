"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Checkout, Asset, AssetType, User } from "@prisma/client";

type CheckoutWithRelations = Checkout & {
  asset: Asset & { assetType: AssetType };
  borrower: User;
};

export function OverdueList({ checkouts }: { checkouts: CheckoutWithRelations[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold">Overdue Checkouts</h2>
        <p className="text-sm text-[var(--text-2)]">Items past due date</p>
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {checkouts.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-4">
            <div>
              <Link
                href={`/assets/${c.assetId}`}
                className="font-medium text-[var(--brand-dark-blue)] hover:underline"
              >
                {c.asset.assetTag}
              </Link>
              <p className="text-sm text-[var(--text-2)]">
                {c.borrower.displayName} — Due {c.dueDate ? format(new Date(c.dueDate), "PP") : "—"}
              </p>
            </div>
            <Badge variant="error">Overdue</Badge>
          </li>
        ))}
      </ul>
      {checkouts.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">No overdue checkouts</div>
      )}
    </div>
  );
}
