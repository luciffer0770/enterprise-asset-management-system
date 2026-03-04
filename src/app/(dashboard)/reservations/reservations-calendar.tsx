"use client";

import { format, startOfWeek, addDays, isSameDay, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Reservation, Asset, AssetType, User } from "@prisma/client";

type ReservationWithRelations = Reservation & {
  asset: (Asset & { assetType: AssetType }) | null;
  requester: User;
};

export function ReservationsCalendar({
  reservations,
}: {
  reservations: ReservationWithRelations[];
}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold">Timeline View</h2>
        <p className="text-sm text-[var(--text-2)]">
          {format(days[0], "MMM d")} — {format(days[days.length - 1], "MMM d, yyyy")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="industrial-table w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="w-40">Asset / Requester</th>
              {days.map((d) => (
                <th
                  key={d.toISOString()}
                  className={`min-w-[60px] text-center text-sm ${
                    isSameDay(d, today) ? "bg-[var(--brand-light-blue)]/10" : ""
                  }`}
                >
                  {format(d, "EEE d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.slice(0, 20).map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="font-medium">
                    {r.asset?.assetTag ?? "Pool"}
                  </div>
                  <div className="text-xs text-[var(--text-2)]">
                    {r.requester.displayName}
                  </div>
                </td>
                {days.map((d) => {
                  const inRange = isWithinInterval(d, {
                    start: new Date(r.startDate),
                    end: new Date(r.endDate),
                  });
                  return (
                    <td
                      key={d.toISOString()}
                      className={`text-center ${inRange ? "bg-[var(--brand-turquoise)]/20" : ""}`}
                    >
                      {inRange ? (
                        <Badge variant="info" className="text-xs">
                          {r.status}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reservations.length === 0 && (
        <div className="p-8 text-center text-[var(--text-2)]">
          No reservations in this period
        </div>
      )}
    </div>
  );
}
