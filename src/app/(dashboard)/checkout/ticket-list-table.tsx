"use client";

import { format } from "date-fns";
import Link from "next/link";

type CheckoutRow = {
  id: string;
  checkedOutAt: Date;
  returnedAt: Date | null;
  requestedByName: string | null;
  requestedByEmployeeId: string | null;
  reason: string | null;
  asset: { id: string; assetTag: string; assetType: { name: string } };
  borrower: { displayName: string | null };
  returnTicket: { status: string } | null;
};

function ticketStatus(c: CheckoutRow): string {
  if (c.returnTicket?.status === "PENDING_APPROVAL") return "Pending approval";
  if (c.returnTicket?.status === "ARCHIVED") return "CLOSED";
  if (c.returnedAt) return "CLOSED";
  return "Issued";
}

function ticketType(c: CheckoutRow): string {
  return c.requestedByEmployeeId ? "external" : "internal";
}

function requesterDisplay(c: CheckoutRow): string {
  const name = c.requestedByName ?? c.borrower?.displayName ?? "—";
  const id = c.requestedByEmployeeId;
  return id ? `${name} / ${id}` : name;
}

export function TicketListTable({ checkouts }: { checkouts: CheckoutRow[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="industrial-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Requester</th>
              <th>Tool</th>
              <th>Status</th>
              <th>Created</th>
              <th>Issued</th>
              <th>Returned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {checkouts.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[var(--text-2)]">
                  No tickets yet. Use the form below to raise a ticket.
                </td>
              </tr>
            ) : (
              checkouts.map((c) => {
                const status = ticketStatus(c);
                return (
                  <tr key={c.id}>
                    <td className="font-mono text-sm">#{c.id.slice(-6)}</td>
                    <td className="capitalize">{ticketType(c)}</td>
                    <td>{requesterDisplay(c)}</td>
                    <td>
                      <Link
                        href={`/assets/${c.asset.id}`}
                        className="text-[var(--brand-dark-blue)] hover:underline"
                      >
                        {c.asset.assetTag} — {c.asset.assetType.name}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "CLOSED"
                            ? "bg-[var(--status-available)]/20 text-[var(--status-available)]"
                            : status === "Pending approval"
                              ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                              : "bg-[var(--brand-dark-blue)]/20 text-[var(--brand-dark-blue)]"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {format(new Date(c.checkedOutAt), "dd MMM yyyy, hh:mm a")}
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {format(new Date(c.checkedOutAt), "dd MMM yyyy, hh:mm a")}
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {c.returnedAt
                        ? format(new Date(c.returnedAt), "dd MMM yyyy, hh:mm a")
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/checkout?assetId=${c.asset.id}`}
                        className="text-sm text-[var(--brand-dark-blue)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
