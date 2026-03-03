"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  canCheckout,
  totalCount,
  page,
  pageSize,
  params,
}: {
  assets: AssetWithRelations[];
  canWrite: boolean;
  canCheckout?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  params?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const totalPages = totalCount && pageSize ? Math.ceil(totalCount / pageSize) : 1;
  const start = totalCount && pageSize && page ? (page - 1) * pageSize + 1 : 1;
  const end = totalCount && pageSize && page ? Math.min(page * pageSize, totalCount) : assets.length;

  function updatePage(newPage: number) {
    if (!params) return;
    const p = new URLSearchParams(params as Record<string, string>);
    p.set("page", String(newPage));
    router.push(`/assets?${p.toString()}`);
  }

  function updatePageSize(size: number) {
    if (!params) return;
    const p = new URLSearchParams(params as Record<string, string>);
    p.set("pageSize", String(size));
    p.set("page", "1");
    router.push(`/assets?${p.toString()}`);
  }
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
              <td>{a.trolleyId && a.trolley ? `${a.trolley.trolleyCode} (${a.trolley.project.name})` : "—"}</td>
              <td>{a.assignedUser?.displayName ?? "—"}</td>
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

      {totalCount != null && totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-sm">
          <div className="flex items-center gap-4">
            <span className="text-[var(--text-2)]">
              Rows per page:
            </span>
            <select
              value={pageSize ?? 20}
              onChange={(e) => updatePageSize(parseInt(e.target.value, 10))}
              className="h-8 rounded border border-[var(--border)] px-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[var(--text-2)]">
              {start}–{end} of {totalCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!page || page <= 1}
              onClick={() => updatePage((page ?? 1) - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">
              Page {page ?? 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!page || (page ?? 1) >= totalPages}
              onClick={() => updatePage((page ?? 1) + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
