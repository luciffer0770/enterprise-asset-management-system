"use client";

import { format } from "date-fns";
import type { AuditLogEvent, User } from "@prisma/client";

type EventWithActor = AuditLogEvent & { actor: User | null };

export function AuditLogTable({ events }: { events: EventWithActor[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="industrial-table w-full">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              let diff: Record<string, unknown> = {};
              try {
                diff = JSON.parse(e.diffJson) as Record<string, unknown>;
              } catch {}
              return (
                <tr key={e.id}>
                  <td className="text-sm whitespace-nowrap">
                    {format(new Date(e.eventTs), "PPp")}
                  </td>
                  <td>{e.actor?.displayName ?? "System"}</td>
                  <td>
                    <span className="font-mono text-xs">{e.entityType}</span>
                    {e.entityId && (
                      <span className="text-[var(--text-2)] ml-1 truncate max-w-[100px] inline-block">
                        {e.entityId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td>{e.action}</td>
                  <td className="max-w-[200px] truncate text-sm text-[var(--text-2)]">
                    {Object.keys(diff).length > 0
                      ? JSON.stringify(diff).slice(0, 80) + "…"
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {events.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">No events</div>
      )}
    </div>
  );
}
