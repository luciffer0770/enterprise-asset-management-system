"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ENTITY_TYPES = [
  "",
  "Asset",
  "Checkout",
  "ReturnTicket",
  "CalibrationEvent",
  "DisposalRecord",
  "WorkOrder",
  "Reservation",
];

const ACTIONS = [
  "",
  "CREATE",
  "UPDATE",
  "CHECKOUT",
  "RETURN_INITIATED",
  "TICKET_APPROVED",
  "TICKET_REJECTED",
];

type Props = {
  entityType?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
};

export function AuditLogFilter({ entityType, action, fromDate, toDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.push(`/audit-logs?${next.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
      <div>
        <Label htmlFor="audit-entity" className="text-xs text-[var(--text-2)]">
          Entity type
        </Label>
        <select
          id="audit-entity"
          value={entityType ?? ""}
          onChange={(e) => update({ entityType: e.target.value || undefined })}
          className="ml-1 mt-0.5 flex h-9 min-w-[140px] rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-sm"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t || "all"} value={t}>
              {t || "All"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="audit-action" className="text-xs text-[var(--text-2)]">
          Action
        </Label>
        <select
          id="audit-action"
          value={action ?? ""}
          onChange={(e) => update({ action: e.target.value || undefined })}
          className="ml-1 mt-0.5 flex h-9 min-w-[160px] rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-sm"
        >
          {ACTIONS.map((a) => (
            <option key={a || "all"} value={a}>
              {a || "All"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="audit-from" className="text-xs text-[var(--text-2)]">
          From date
        </Label>
        <input
          id="audit-from"
          type="date"
          value={fromDate ?? ""}
          onChange={(e) => update({ fromDate: e.target.value || undefined })}
          className="ml-1 mt-0.5 flex h-9 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="audit-to" className="text-xs text-[var(--text-2)]">
          To date
        </Label>
        <input
          id="audit-to"
          type="date"
          value={toDate ?? ""}
          onChange={(e) => update({ toDate: e.target.value || undefined })}
          className="ml-1 mt-0.5 flex h-9 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-sm"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => router.push("/audit-logs")}
      >
        Clear filters
      </Button>
    </div>
  );
}
