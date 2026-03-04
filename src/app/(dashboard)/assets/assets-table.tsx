"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, MoreHorizontal } from "lucide-react";
import type { Asset, AssetType, OrgUnit, Location, User, InventoryPool } from "@prisma/client";

type AssetWithRelations = Asset & {
  assetType: AssetType;
  ownerOrgUnit: OrgUnit | null;
  location: Location | null;
  assignedUser: User | null;
  pool?: InventoryPool | null;
};

function StatusPill({ status }: { status: string }) {
  const label =
    status === "IN_SERVICE"
      ? "Available"
      : status === "CHECKED_OUT"
        ? "Issued"
        : status === "UNDER_MAINTENANCE"
          ? "Maintenance"
          : status === "RESERVED"
            ? "Trolley"
            : status;
  const style =
    status === "IN_SERVICE"
      ? "bg-[var(--status-available)]/20 text-[var(--brand-dark-green)] border border-[var(--status-available)]/50"
      : status === "CHECKED_OUT"
        ? "bg-[var(--status-issued)]/15 text-[var(--status-issued)] border border-[var(--status-issued)]/40"
        : status === "UNDER_MAINTENANCE"
          ? "bg-[var(--status-maintenance)]/20 text-[#B45309] border border-[var(--status-maintenance)]/50"
          : status === "RESERVED"
            ? "bg-[var(--status-trolley)]/15 text-[var(--brand-dark-blue)] border border-[var(--status-trolley)]/40"
            : "bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export function AssetsTable({
  assets,
  canWrite,
}: {
  assets: AssetWithRelations[];
  canWrite: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="industrial-table w-full">
        <thead>
          <tr>
            <th>Tool Code</th>
            <th>Tool Name</th>
            <th>Category</th>
            <th>Ownership</th>
            <th>Status</th>
            <th>Trolley</th>
            <th>Project</th>
            {canWrite && <th className="w-28">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id}>
              <td>
                <Link
                  href={`/assets/${a.id}`}
                  className="font-medium text-[var(--brand-dark-blue)] hover:underline"
                >
                  {a.assetTag}
                </Link>
              </td>
              <td>{a.assetType.name}</td>
              <td className="capitalize">{a.assetType.category}</td>
              <td>{a.ownerOrgUnit?.name ?? "Internal"}</td>
              <td>
                <StatusPill status={a.lifecycleState} />
              </td>
              <td>{a.pool?.name ?? "—"}</td>
              <td>{a.location?.name ?? "—"}</td>
              {canWrite && (
                <td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                      <Link href={`/assets/${a.id}/edit`} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="More">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {assets.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">
          No tools found
        </div>
      )}
    </div>
  );
}
