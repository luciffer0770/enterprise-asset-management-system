"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Checkout = {
  id: string;
  checkedOutAt: Date;
  dueDate: Date | null;
  returnedAt: Date | null;
  asset: { id: string; assetTag: string; lifecycleState: string; assetType: { name: string } };
  borrower: { displayName: string; email: string };
  returnTicket?: { id: string; status: string } | null;
};

type Props = {
  checkouts: Checkout[];
  pendingTickets: Array<{
    id: string;
    status: string;
    checkout: Checkout;
  }>;
  statusFilter?: string;
  canApprove: boolean;
};

export function TicketQueue({ checkouts, pendingTickets, statusFilter, canApprove }: Props) {
  const router = useRouter();
  const [approvalTicket, setApprovalTicket] = useState<{ id: string; assetTag: string } | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [notes, setNotes] = useState("");
  const [assetState, setAssetState] = useState<"IN_SERVICE" | "UNDER_MAINTENANCE" | "QUARANTINED">("IN_SERVICE");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!approvalTicket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${approvalTicket.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes, assetState: decision === "APPROVE" ? assetState : undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      setApprovalTicket(null);
      setNotes("");
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === "pending" && "Pending Approval"}
            {statusFilter === "overdue" && "Overdue Checkouts"}
            {statusFilter === "active" && "Active (Issued)"}
            {!statusFilter && "All Tickets & Checkouts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusFilter === "pending" && pendingTickets.length > 0 ? (
            <div className="space-y-3">
              {pendingTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
                >
                  <div>
                    <span className="font-medium">{t.checkout.asset.assetTag}</span>
                    <span className="text-[var(--text-2)] ml-2">
                      {t.checkout.borrower.displayName}
                    </span>
                  </div>
                  {canApprove && (
                    <Button
                      size="sm"
                      onClick={() => setApprovalTicket({ id: t.id, assetTag: t.checkout.asset.assetTag })}
                    >
                      Approve / Reject
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : statusFilter === "overdue" ? (
            <CheckoutList checkouts={checkouts.filter((c) => c.dueDate && c.dueDate < now && !c.returnedAt)} />
          ) : statusFilter === "active" ? (
            <CheckoutList checkouts={checkouts.filter((c) => !c.returnedAt)} />
          ) : (
            <div className="space-y-4">
              {pendingTickets.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Pending Approval ({pendingTickets.length})</h3>
                  <CheckoutList checkouts={pendingTickets.map((t) => t.checkout)} compact />
                </div>
              )}
              <div>
                <h3 className="font-medium mb-2">Active Checkouts</h3>
                <CheckoutList checkouts={checkouts.filter((c) => !c.returnedAt)} compact />
              </div>
            </div>
          )}
          {((statusFilter === "pending" && pendingTickets.length === 0) ||
            (statusFilter === "overdue" && checkouts.filter((c) => c.dueDate && c.dueDate < now && !c.returnedAt).length === 0) ||
            (statusFilter === "active" && checkouts.filter((c) => !c.returnedAt).length === 0)) && (
            <p className="text-[var(--text-2)] py-4">No items.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!approvalTicket} onOpenChange={() => setApprovalTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve / Reject Return - {approvalTicket?.assetTag}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Decision</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={decision === "APPROVE" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setDecision("APPROVE")}
                >
                  Approve
                </Button>
                <Button
                  variant={decision === "REJECT" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setDecision("REJECT")}
                >
                  Reject
                </Button>
              </div>
            </div>
            {decision === "APPROVE" && (
              <div>
                <Label>Asset state after return</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={assetState}
                  onChange={(e) => setAssetState(e.target.value as typeof assetState)}
                >
                  <option value="IN_SERVICE">In Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="QUARANTINED">Quarantined</option>
                </select>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Decision notes..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Processing..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CheckoutList({
  checkouts,
  compact,
}: {
  checkouts: Checkout[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {checkouts.map((c) => (
        <div
          key={c.id}
          className={`flex items-center justify-between ${compact ? "py-2" : "p-3"} border border-[var(--border)] rounded-lg`}
        >
          <div>
            <span className="font-medium">{c.asset.assetTag}</span>
            <span className="text-[var(--text-2)] ml-2">({c.asset.assetType.name})</span>
            <span className="text-sm text-[var(--text-2)] ml-2">
              — {c.borrower.displayName}
              {c.dueDate && (
                <span className={c.dueDate < new Date() ? " text-[var(--error)]" : ""}>
                  {" "}
                  Due: {c.dueDate.toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
          {c.returnTicket && (
            <Badge variant="neutral">{c.returnTicket.status}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
