"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Ticket = {
  id: string;
  status: string;
  asset: { assetTag: string; assetType: { name: string } };
  checkout: { borrower: { displayName: string }; dueDate: string | null };
  createdAt: string;
};

export function TicketApproveModal({
  ticket,
  open,
  onClose,
}: {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"APPROVE_OK" | "APPROVE_WITH_ISSUE" | "REJECT">("APPROVE_OK");
  const [assetState, setAssetState] = useState("UNDER_MAINTENANCE");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!ticket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: notes || undefined,
          assetState: decision === "APPROVE_WITH_ISSUE" ? assetState : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve ticket — {ticket.asset.assetTag}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-[var(--text-2)]">
            Tool: {ticket.asset.assetType.name} · Raised by: {ticket.checkout.borrower.displayName}
          </p>
          <div>
            <Label>Decision</Label>
            <Select
              value={decision}
              onValueChange={(v) => setDecision(v as "APPROVE_OK" | "APPROVE_WITH_ISSUE" | "REJECT")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVE_OK">Approve (return to service)</SelectItem>
                <SelectItem value="APPROVE_WITH_ISSUE">Approve with issue</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {decision === "APPROVE_WITH_ISSUE" && (
            <div>
              <Label>Asset state</Label>
              <Select value={assetState} onValueChange={setAssetState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                  <SelectItem value="QUARANTINED">Quarantined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Decision notes"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={decision === "REJECT" ? "bg-[var(--status-issued)] text-white" : "bg-[var(--status-available)] text-white"}
            >
              {decision === "REJECT" ? "Reject" : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
