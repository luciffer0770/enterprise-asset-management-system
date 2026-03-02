"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CalibrationEvent, Asset, AssetType } from "@prisma/client";

type CalWithAsset = CalibrationEvent & {
  asset: Asset & { assetType: AssetType };
};

export function CalibrationTable({
  items,
  canWrite,
}: {
  items: CalWithAsset[];
  canWrite: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="industrial-table w-full">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Last Result</th>
            <th>Next Due</th>
            {canWrite && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>
                <Link
                  href={`/assets/${c.assetId}`}
                  className="font-medium text-[var(--brand-dark-blue)] hover:underline"
                >
                  {c.asset.assetTag}
                </Link>
                <p className="text-xs text-[var(--text-2)]">{c.asset.assetType.name}</p>
              </td>
              <td>
                <Badge
                  variant={
                    c.result === "PASS"
                      ? "success"
                      : c.result === "OOT"
                        ? "error"
                        : "warning"
                  }
                >
                  {c.result}
                </Badge>
              </td>
              <td className="text-sm">
                {c.nextDueDate ? format(new Date(c.nextDueDate), "PP") : "—"}
              </td>
              {canWrite && (
                <td>
                  <button
                    type="button"
                    className="text-sm text-[var(--brand-dark-blue)] hover:underline"
                  >
                    Upload cert
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">None</div>
      )}
    </div>
  );
}
