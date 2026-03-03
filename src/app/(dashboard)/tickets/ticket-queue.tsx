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

type IssueRequest = {
  id: string;
  borrowerName: string;
  borrowerEmpId: string;
  reason: string;
  asset: { id: string; assetTag: string; assetType: { name: string } };
  requester: { displayName: string };
};

type Props = {
  checkouts: Checkout[];
  pendingReturnTickets: Array<{ id: string; status: string; checkout: Checkout }>;
  pendingIssueRequests: IssueRequest[];
  statusFilter?: string;
  canApprove: boolean;
  canReturn?: boolean;
};

export function TicketQueue({ checkouts, pendingReturnTickets, pendingIssueRequests, statusFilter, canApprove, canReturn }: Props) {
  const router = useRouter();
  const [approvalReturnTicket, setApprovalReturnTicket] = useState<{ id: string; assetTag: string } | null>(null);
  const [approvingIssueId, setApprovingIssueId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [notes, setNotes] = useState("");
  const [assetState, setAssetState] = useState<"IN_SERVICE" | "UNDER_MAINTENANCE" | "QUARANTINED">("IN_SERVICE");
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  async function handleReturn(assetId: string) {
    setReturningId(assetId);
    try {
      const res = await fetch("/api/checkout/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Return failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Return failed");
    } finally {
      setReturningId(null);
    }
  }

  async function handleApproveReturn() {
    if (!approvalReturnTicket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${approvalReturnTicket.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes, assetState: decision === "APPROVE" ? assetState : undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      setApprovalReturnTicket(null);
      setNotes("");
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveIssueRequest(id: string, d: "APPROVE" | "REJECT") {
    setApprovingIssueId(id);
    try {
      const res = await fetch(`/api/issue-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: d }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setApprovingIssueId(null);
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
          {statusFilter === "pending" && (pendingReturnTickets.length > 0 || pendingIssueRequests.length > 0) ? (
            <div className="space-y-4">
              {pendingIssueRequests.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Issue requests (awaiting approval)</h3>
                  {pendingIssueRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg mb-2">
                      <div>
                        <span className="font-medium">{r.asset.assetTag}</span>
                        <span className="text-[var(--text-2)] ml-2">({r.asset.assetType.name})</span>
                        <span className="text-sm text-[var(--text-2)] ml-2">
                          — {r.borrowerName} ({r.borrowerEmpId}) • {r.reason}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] ml-2 block">Requested by {r.requester.displayName}</span>
                      </div>
                      {canApprove && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApproveIssueRequest(r.id, "APPROVE")} disabled={approvingIssueId === r.id}>
                            {approvingIssueId === r.id ? "..." : "Approve"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleApproveIssueRequest(r.id, "REJECT")} disabled={approvingIssueId === r.id}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {pendingReturnTickets.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Return tickets (awaiting approval)</h3>
                  {pendingReturnTickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg mb-2">
                      <div>
                        <span className="font-medium">{t.checkout.asset.assetTag}</span>
                        <span className="text-[var(--text-2)] ml-2">{t.checkout.borrower.displayName}</span>
                      </div>
                      {canApprove && (
                        <Button size="sm" onClick={() => setApprovalReturnTicket({ id: t.id, assetTag: t.checkout.asset.assetTag })}>
                          Approve / Reject
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : statusFilter === "overdue" ? (
            <CheckoutList checkouts={checkouts.filter((c) => c.dueDate && c.dueDate < now && !c.returnedAt)} canReturn={canReturn} onReturn={handleReturn} returningId={returningId} />
          ) : statusFilter === "active" ? (
            <CheckoutList checkouts={checkouts.filter((c) => !c.returnedAt)} canReturn={canReturn} onReturn={handleReturn} returningId={returningId} />
          ) : (
            <div className="space-y-4">
              {pendingIssueRequests.length > 0 && canApprove && (
                <div>
                  <h3 className="font-medium mb-2">Issue requests pending approval ({pendingIssueRequests.length})</h3>
                  {pendingIssueRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border border-[var(--border)] rounded-lg px-3 mb-2">
                      <span className="font-medium">{r.asset.assetTag}</span>
                      <span className="text-sm text-[var(--text-2)]">{r.borrowerName}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApproveIssueRequest(r.id, "APPROVE")} disabled={approvingIssueId === r.id}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproveIssueRequest(r.id, "REJECT")} disabled={approvingIssueId === r.id}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pendingReturnTickets.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Return tickets pending approval</h3>
                  <CheckoutList checkouts={pendingReturnTickets.map((t) => t.checkout)} compact />
                </div>
              )}
              <div>
                <h3 className="font-medium mb-2">Active Checkouts (issued & approved)</h3>
                <CheckoutList checkouts={checkouts.filter((c) => !c.returnedAt)} compact canReturn={canReturn} onReturn={handleReturn} returningId={returningId} />
              </div>
            </div>
          )}
          {((statusFilter === "pending" && pendingReturnTickets.length === 0 && pendingIssueRequests.length === 0) ||
            (statusFilter === "overdue" && checkouts.filter((c) => c.dueDate && c.dueDate < now && !c.returnedAt).length === 0) ||
            (statusFilter === "active" && checkouts.filter((c) => !c.returnedAt).length === 0)) && (
            <p className="text-[var(--text-2)] py-4">No items.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!approvalReturnTicket} onOpenChange={() => setApprovalReturnTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve / Reject Return - {approvalReturnTicket?.assetTag}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Decision</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={decision === "APPROVE" ? "primary" : "outline"} size="sm" onClick={() => setDecision("APPROVE")}>Approve</Button>
                <Button variant={decision === "REJECT" ? "destructive" : "outline"} size="sm" onClick={() => setDecision("REJECT")}>Reject</Button>
              </div>
            </div>
            {decision === "APPROVE" && (
              <div>
                <Label>Asset state after return</Label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md" value={assetState} onChange={(e) => setAssetState(e.target.value as typeof assetState)}>
                  <option value="IN_SERVICE">In Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="QUARANTINED">Quarantined</option>
                </select>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalReturnTicket(null)}>Cancel</Button>
            <Button onClick={handleApproveReturn} disabled={loading}>{loading ? "..." : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CheckoutList({
  checkouts,
  compact,
  canReturn,
  onReturn,
  returningId,
}: {
  checkouts: Checkout[];
  compact?: boolean;
  canReturn?: boolean;
  onReturn?: (assetId: string) => void;
  returningId?: string | null;
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
          <div className="flex items-center gap-2">
            {c.returnTicket && (
              <Badge variant="neutral">{c.returnTicket.status}</Badge>
            )}
            {!c.returnedAt && !c.returnTicket && canReturn && onReturn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReturn(c.asset.id)}
                disabled={returningId === c.asset.id}
              >
                {returningId === c.asset.id ? "Returning…" : "Return"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
