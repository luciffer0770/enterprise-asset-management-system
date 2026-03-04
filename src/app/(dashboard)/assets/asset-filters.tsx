"use client";

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrgUnit, AssetType, InventoryPool } from "@prisma/client";

const selectClass =
  "h-[var(--input-height)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm w-[140px]";

export function AssetFilters({
  orgUnits,
  types,
  pools = [],
}: {
  orgUnits: OrgUnit[];
  types: AssetType[];
  pools?: InventoryPool[];
}) {
  const searchParams = useSearchParams();

  return (
    <form method="get" action="/assets" className="flex flex-wrap gap-3 items-center">
      <select
        name="type"
        className={selectClass}
        defaultValue={searchParams.get("type") ?? ""}
      >
        <option value="">Category</option>
        {types.map((t) => (
          <option key={t.id} value={t.category}>
            {t.name}
          </option>
        ))}
      </select>
      <Input
        name="q"
        placeholder="Search by tool code or name..."
        className="max-w-xs"
        defaultValue={searchParams.get("q") ?? ""}
      />
      {pools.length > 0 && (
        <select
          name="pool"
          className={selectClass}
          defaultValue={searchParams.get("pool") ?? ""}
        >
          <option value="">Trolley</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <select
        name="status"
        className={selectClass}
        defaultValue={searchParams.get("status") ?? ""}
      >
        <option value="">All statuses</option>
        <option value="IN_SERVICE">In Service</option>
        <option value="CHECKED_OUT">Checked Out</option>
        <option value="RESERVED">Reserved</option>
        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
        <option value="UNDER_CALIBRATION">Under Calibration</option>
        <option value="QUARANTINED">Quarantined</option>
        <option value="DISPOSED">Disposed</option>
      </select>
      <select
        name="orgUnit"
        className={selectClass}
        defaultValue={searchParams.get("orgUnit") ?? ""}
      >
        <option value="">All org units</option>
        {orgUnits.map((ou) => (
          <option key={ou.id} value={ou.id}>
            {ou.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary" className="flex items-center gap-1.5">
        Filters
      </Button>
    </form>
  );
}
