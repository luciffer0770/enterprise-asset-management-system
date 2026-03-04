"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TicketApproveModal } from "./ticket-approve-modal";

type TicketRow = {
  id: string;
  status: string;
  asset: { assetTag: string; assetType: { name: string } };
  checkout: {
    borrower: { displayName: string };
    dueDate: string | null;
    reason?: string | null;
    requestedByName?: string | null;
    requestedByEmployeeId?: string | null;
  };
  createdAt: string;
  resolutionNotes: string | null;
  approver: { displayName: string } | null;
};

export function TicketBoard({
  pendingTickets,
  archivedTickets,
  canApprove,
}: {
  pendingTickets: TicketRow[];
  archivedTickets: TicketRow[];
  canApprove: boolean;
}) {
  const [modalTicket, setModalTicket] = useState<TicketRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-[var(--text-0)] mb-1">Pending approval</h3>
            <p className="text-sm text-[var(--text-2)] mb-3">
              Return tickets awaiting approver decision
            </p>
            <ul className="space-y-2">
              {pendingTickets.length === 0 ? (
                <li className="text-sm text-[var(--text-muted)]">No pending tickets</li>
              ) : (
                pendingTickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-0)]">
                        Tool: {t.asset.assetTag} — {t.asset.assetType.name}
                      </p>
                      <p className="text-sm text-[var(--text-2)]">
                        Name: {t.checkout.requestedByName ?? t.checkout.borrower?.displayName ?? "—"}
                        {t.checkout.requestedByEmployeeId && (
                          <> · Emp ID: {t.checkout.requestedByEmployeeId}</>
                        )}
                      </p>
                      {t.checkout.reason && (
                        <p className="text-xs text-[var(--text-muted)]">Reason: {t.checkout.reason}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)]">
                        {format(new Date(t.createdAt), "PPp")}
                      </p>
                    </div>
                    {canApprove && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-[var(--status-available)] text-white hover:opacity-90"
                          onClick={() => setModalTicket(t)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setModalTicket(t);
                            // Modal will allow choosing Reject
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-[var(--text-0)] mb-1">Closed (archived)</h3>
            <p className="text-sm text-[var(--text-2)] mb-3">Recently resolved return tickets</p>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {archivedTickets.length === 0 ? (
                <li className="text-sm text-[var(--text-muted)]">No closed tickets</li>
              ) : (
                archivedTickets.slice(0, 20).map((t) => (
                  <li
                    key={t.id}
                    className="p-2 rounded border border-[var(--border-subtle)] text-sm"
                  >
                    <span className="font-medium">{t.asset.assetTag}</span>
                    <span className="text-[var(--text-2)] ml-2">
                      {t.checkout.requestedByName ?? t.checkout.borrower?.displayName ?? "—"}
                      {t.checkout.requestedByEmployeeId ? ` · ${t.checkout.requestedByEmployeeId}` : ""}
                    </span>
                    <span className="text-[var(--text-muted)] ml-2">
                      · {t.approver?.displayName ?? "—"} · {format(new Date(t.createdAt), "PP")}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <TicketApproveModal
        ticket={modalTicket}
        open={!!modalTicket}
        onClose={() => setModalTicket(null)}
      />
    </div>
  );
}
