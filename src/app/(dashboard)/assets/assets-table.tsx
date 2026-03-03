"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Asset, AssetType, OrgUnit, Location, User } from "@prisma/client";

type TrolleyWithProject = { trolleyCode: string; project: { name: string } };
type AssetWithRelations = Asset & {
  assetType: AssetType;
  ownerOrgUnit: OrgUnit | null;
  location: Location | null;
  trolley: TrolleyWithProject | null;
  assignedUser: User | null;
};

export function AssetsTable({
  assets,
  canWrite,
}: {
  assets: AssetWithRelations[];
  canWrite: boolean;
}) {
  function statusVariant(s: string) {
    if (["IN_SERVICE", "PASS"].includes(s)) return "success";
    if (["CHECKED_OUT", "RESERVED", "OPEN", "RETURN_PENDING"].includes(s)) return "info";
    if (["UNDER_MAINTENANCE", "UNDER_CALIBRATION", "QUARANTINED"].includes(s))
      return "warning";
    if (["DISPOSED", "FAIL", "OOT"].includes(s)) return "error";
    return "neutral";
  }

  return (
    <div className="overflow-x-auto">
      <table className="industrial-table w-full">
        <thead>
          <tr>
            <th>Tag</th>
            <th>Type</th>
            <th>Status</th>
            <th>Org Unit</th>
            <th>Location</th>
            <th>Trolley</th>
            <th>Assigned To</th>
            <th>Calibration Due</th>
            <th>NBV</th>
            {canWrite && <th className="w-24">Actions</th>}
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
              <td>
                <Badge variant={statusVariant(a.lifecycleState)}>
                  {a.lifecycleState}
                </Badge>
              </td>
              <td>{a.ownerOrgUnit?.name ?? "—"}</td>
              <td>{a.locationPath ?? a.location?.name ?? "—"}</td>
              <td>{a.trolley ? `${a.trolley.trolleyCode} (${a.trolley.project.name})` : "—"}</td>
              <td>{a.assignedUser?.displayName ?? "—"}</td>
              <td className="text-sm text-[var(--text-2)]">
                {/* Would need calibration join - simplified */}
                —
              </td>
              <td>
                {a.purchaseCost != null
                  ? `$${a.purchaseCost.toLocaleString()}`
                  : "—"}
              </td>
              {canWrite && (
                <td>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/assets/${a.id}/edit`}>Edit</Link>
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {assets.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">
          No assets found
        </div>
      )}
    </div>
  );
}
