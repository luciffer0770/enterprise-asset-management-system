"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { OrgUnit, AssetType } from "@prisma/client";

export function AssetFilterSidebar({
  orgUnits,
  types,
  currentOrgUnit,
  currentType,
  currentStatus,
  showInactive,
}: {
  orgUnits: OrgUnit[];
  types: AssetType[];
  currentOrgUnit: string;
  currentType: string;
  currentStatus: string;
  showInactive: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teamOpen, setTeamOpen] = useState(true);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/assets?${params.toString()}`);
  }

  return (
    <div className="hidden lg:block rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4 w-52 shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-[var(--text-2)]" />
        <span className="font-semibold text-sm">Filters</span>
      </div>

      <div className="space-y-4">
        <div>
          <button
            onClick={() => setTeamOpen(!teamOpen)}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--text-1)]"
          >
            {teamOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Filter by Team
          </button>
          {teamOpen && (
            <div className="mt-2 space-y-1 pl-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="orgUnit"
                  checked={!currentOrgUnit}
                  onChange={() => updateParams({ orgUnit: undefined })}
                  className="rounded"
                />
                All
              </label>
              {orgUnits.map((ou) => (
                <label key={ou.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="orgUnit"
                    checked={currentOrgUnit === ou.id}
                    onChange={() => updateParams({ orgUnit: ou.id })}
                    className="rounded"
                  />
                  {ou.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-1)] block mb-2">Asset Type</label>
          <select
            value={currentType}
            onChange={(e) => updateParams({ type: e.target.value || undefined })}
            className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm"
          >
            <option value="">All Asset Types</option>
            {types.map((t) => (
              <option key={t.id} value={t.category}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-1)] block mb-2">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateParams({ status: e.target.value || undefined })}
            className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm"
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
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => updateParams({ inactive: e.target.checked ? "1" : undefined })}
            className="rounded"
          />
          Show Inactive
        </label>
      </div>
    </div>
  );
}
