"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, Eye, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IssueToolSection } from "./issue-tool-section";

export type TicketRow = {
  id: string;
  type: "issue_request" | "checkout" | "return_ticket";
  ticketId: string;
  toolName: string;
  toolTag: string;
  project: string;
  raisedBy: string;
  department: string;
  expectedReturn: string | null;
  status: "PENDING" | "APPROVED" | "ISSUED" | "OVERDUE" | "CLOSED";
  purpose?: string;
  issueDate?: string;
  condition?: string;
  assetId?: string;
  returnTicketId?: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ISSUED", label: "Issued" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CLOSED", label: "Closed" },
];

function StatusBadge({ status }: { status: TicketRow["status"] }) {
  const map: Record<TicketRow["status"], { variant: "warning" | "info" | "error" | "success"; cls?: string }> = {
    PENDING: { variant: "warning", cls: "bg-amber-100 text-amber-800" },
    APPROVED: { variant: "info", cls: "bg-blue-100 text-blue-800" },
    ISSUED: { variant: "info", cls: "bg-violet-100 text-violet-800" },
    OVERDUE: { variant: "error", cls: "bg-red-100 text-red-800" },
    CLOSED: { variant: "success", cls: "bg-emerald-100 text-emerald-800" },
  };
  const { cls } = map[status] ?? {};
  return (
    <Badge variant={map[status]?.variant ?? "neutral"} className={cls}>
      {status}
    </Badge>
  );
}

type Props = {
  tickets: TicketRow[];
  kpis: { active: number; pending: number; issued: number; overdue: number; closedToday: number };
  canApprove: boolean;
  canReturn: boolean;
  canClose: boolean;
  availableAssets: Parameters<typeof IssueToolSection>[0]["availableAssets"];
  trolleys: Parameters<typeof IssueToolSection>[0]["trolleys"];
  role: string;
  initialStatusFilter?: string;
};

export function TicketsPageClient({
  tickets,
  kpis,
  canApprove,
  canReturn,
  canClose,
  availableAssets,
  trolleys,
  role,
  initialStatusFilter = "all",
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [returnDecision, setReturnDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [returnNotes, setReturnNotes] = useState("");
  const [assetState, setAssetState] = useState<"IN_SERVICE" | "UNDER_MAINTENANCE" | "QUARANTINED">("IN_SERVICE");
  const [closeReason, setCloseReason] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = tickets;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.toolName.toLowerCase().includes(q) ||
          t.toolTag.toLowerCase().includes(q) ||
          t.raisedBy.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [tickets, search, statusFilter]);

  async function handleApproveIssueRequest(id: string, decision: "APPROVE" | "REJECT") {
    setLoading(true);
    try {
      const res = await fetch(`/api/issue-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error(await res.json().then((d) => d.message).catch(() => "Failed"));
      setSelectedTicket(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveReturn(ticketId: string, decision: "APPROVE" | "REJECT") {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: returnNotes,
          assetState: decision === "APPROVE" ? assetState : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.json().then((d) => d.message).catch(() => "Failed"));
      setSelectedTicket(null);
      setReturnNotes("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseCheckout(checkoutId: string) {
    if (!closeReason.trim()) {
      alert("Please enter a reason for closing");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${checkoutId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: closeReason.trim() }),
      });
      if (!res.ok) throw new Error(await res.json().then((d: { message?: string }) => d.message).catch(() => "Failed"));
      setSelectedTicket(null);
      setCloseReason("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(assetId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) throw new Error(await res.json().then((d) => d.message).catch(() => "Failed"));
      setSelectedTicket(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>

      {/* Issue Tool section (collapsible for users who can checkout) */}
      {(canReturn || canApprove) && (
        <IssueToolSection
          availableAssets={availableAssets}
          trolleys={trolleys}
          role={role}
          onIssue={() => router.refresh()}
        />
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <LinkCard href="/tickets?status=active" label="Active Tickets" value={kpis.active} color="text-blue-700" />
        <LinkCard href="/tickets?status=pending" label="Pending Approval" value={kpis.pending} color="text-amber-600" />
        <LinkCard href="/tickets?status=active" label="Issued" value={kpis.issued} color="text-violet-700" />
        <LinkCard href="/tickets?status=overdue" label="Overdue" value={kpis.overdue} color="text-red-600" />
        <LinkCard href="/tickets?status=closed" label="Closed Today" value={kpis.closedToday} color="text-emerald-700" />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filter
            <ChevronDown className={`h-4 w-4 transition ${filterOpen ? "rotate-180" : ""}`} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 py-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${statusFilter === opt.value ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tool Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Project</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Raised By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Expected Return</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={`${t.type}-${t.id}`}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${selectedTicket?.id === t.id ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{t.ticketId}</td>
                  <td className="px-4 py-3 text-gray-700">{t.toolName}</td>
                  <td className="px-4 py-3 text-gray-600">{t.project}</td>
                  <td className="px-4 py-3 text-gray-600">{t.raisedBy}</td>
                  <td className="px-4 py-3 text-gray-600">{t.department}</td>
                  <td className="px-4 py-3 text-gray-600">{t.expectedReturn ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">No tickets found</div>
        )}
      </div>

      {/* Side Panel as Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <DetailRow label="Tool ID" value={selectedTicket.toolTag} />
              <DetailRow label="Purpose" value={selectedTicket.purpose ?? selectedTicket.raisedBy} />
              <DetailRow label="Issue Date" value={selectedTicket.issueDate ?? "—"} />
              <DetailRow label="Expected Return" value={selectedTicket.expectedReturn ?? "—"} />
              <DetailRow label="Condition on Issue" value={selectedTicket.condition ?? "—"} />
              <DetailRow label="Status" value={selectedTicket.status} />

              {(selectedTicket.type === "issue_request" && selectedTicket.status === "PENDING" && canApprove) && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApproveIssueRequest(selectedTicket.id, "APPROVE")}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproveIssueRequest(selectedTicket.id, "REJECT")}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {(selectedTicket.type === "return_ticket" && selectedTicket.status === "PENDING" && canApprove && selectedTicket.returnTicketId) && (
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Decision</Label>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant={returnDecision === "APPROVE" ? "primary" : "outline"} onClick={() => setReturnDecision("APPROVE")}>Approve</Button>
                      <Button size="sm" variant={returnDecision === "REJECT" ? "destructive" : "outline"} onClick={() => setReturnDecision("REJECT")}>Reject</Button>
                    </div>
                  </div>
                  {returnDecision === "APPROVE" && (
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
                    <Textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows={2} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveReturn(selectedTicket.returnTicketId!, returnDecision)} disabled={loading}>
                      {loading ? "..." : "Submit"}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {(selectedTicket.type === "checkout" && selectedTicket.status === "ISSUED" && canReturn && selectedTicket.assetId) && (
                <div className="pt-4">
                  <Button onClick={() => handleReturn(selectedTicket.assetId!)} disabled={loading}>
                    {loading ? "..." : "Initiate Return"}
                  </Button>
                </div>
              )}

              {(selectedTicket.type === "checkout" && selectedTicket.status === "OVERDUE" && canClose) && (
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Close reason (required)</Label>
                    <Textarea
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                      placeholder="e.g. Tool returned late, no action needed"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => handleCloseCheckout(selectedTicket.id)}
                    disabled={loading || !closeReason.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? "..." : "Close Ticket"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinkCard({ href, label, value, color }: { href: string; label: string; value: number; color: string }) {
  return (
    <Link href={href}>
      <Card className="border-gray-200 hover:border-blue-300 transition-colors h-full">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
