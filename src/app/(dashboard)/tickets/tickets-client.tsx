"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Download,
  Wrench,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-800",
  ISSUED: "bg-violet-100 text-violet-800",
  OVERDUE: "bg-red-100 text-red-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
};

const TYPE_LABELS: Record<string, string> = {
  issue_request: "Issue Request",
  checkout: "Checkout",
  return_ticket: "Return",
};

const CHART_COLORS = ["#f59e0b", "#8b5cf6", "#ef4444", "#10b981", "#6366f1"];

type Props = {
  tickets: TicketRow[];
  kpis: {
    open: number;
    pending: number;
    overdue: number;
    resolvedMonth: number;
    highPriority: number;
  };
  typeData: { name: string; value: number }[];
  statusData: { name: string; value: number; color: string }[];
  availableAssets: Parameters<typeof IssueToolSection>[0]["availableAssets"];
  trolleys: Parameters<typeof IssueToolSection>[0]["trolleys"];
  canApprove: boolean;
  canReturn: boolean;
  canClose: boolean;
  canCreateWO: boolean;
  role: string;
  totalCount: number;
  page: number;
  pageSize: number;
  params: Record<string, string | undefined>;
};

export function TicketsClient(props: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(props.params.q ?? "");
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [returnDecision, setReturnDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [returnNotes, setReturnNotes] = useState("");
  const [assetState, setAssetState] = useState<"IN_SERVICE" | "UNDER_MAINTENANCE" | "QUARANTINED">("IN_SERVICE");
  const [closeReason, setCloseReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const statusParam = props.params.status === "overdue" ? "OVERDUE" : props.params.status === "pending" ? "PENDING" : props.params.status === "active" ? "ISSUED" : props.params.status;
  const filtered = props.tickets.filter((t) => {
    if (statusParam && statusParam !== "all" && t.status !== statusParam) return false;
    if (props.params.type && t.type !== props.params.type) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !t.ticketId.toLowerCase().includes(q) &&
        !t.toolName.toLowerCase().includes(q) &&
        !t.toolTag.toLowerCase().includes(q) &&
        !t.raisedBy.toLowerCase().includes(q) &&
        !t.project.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / props.pageSize) || 1;
  const start = (props.page - 1) * props.pageSize;
  const paginated = filtered.slice(start, start + props.pageSize);
  const selected = selectedTicket ? paginated.find((t) => t.id === selectedTicket.id && t.type === selectedTicket.type) ?? selectedTicket : null;

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(props.params as Record<string, string>);
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/tickets?${p.toString()}`);
  }

  async function handleApproveIssue(id: string, decision: "APPROVE" | "REJECT") {
    setLoading(true);
    try {
      const res = await fetch(`/api/issue-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed");
      setSelectedTicket(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveReturn(ticketId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: returnDecision,
          notes: returnNotes,
          assetState: returnDecision === "APPROVE" ? assetState : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed");
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
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed");
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
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed");
      setSelectedTicket(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    const res = await fetch(`/api/tickets/export?${new URLSearchParams(props.params as Record<string, string>).toString()}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Service Desk &amp; Ticketing Management</h1>
        <div className="flex items-center gap-2">
          {(props.canReturn || props.canApprove) && (
            <Button
              className="bg-[var(--brand-dark-blue)]"
              onClick={() => setShowIssueForm(!showIssueForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Ticket Report
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showIssueForm && (
        <IssueToolSection
          availableAssets={props.availableAssets}
          trolleys={props.trolleys}
          role={props.role}
          onIssue={() => { setShowIssueForm(false); router.refresh(); }}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button onClick={() => updateParams({ status: undefined })} className="text-left">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-[var(--text-2)]">Open Tickets</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-600">{props.kpis.open}</p>
          </div>
        </button>
        <button onClick={() => updateParams({ status: "PENDING" })} className="text-left">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-[var(--text-2)]">Pending Approval</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{props.kpis.pending}</p>
          </div>
        </button>
        <button onClick={() => updateParams({ status: "OVERDUE" })} className="text-left">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-[var(--text-2)]">Overdue</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.overdue}</p>
          </div>
        </button>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-[var(--text-2)]">High Priority</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-600">{props.kpis.highPriority}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-2)]">Resolved This Month</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{props.kpis.resolvedMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={props.params.type ?? ""}
          onChange={(e) => updateParams({ type: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="issue_request">Issue Request</option>
          <option value="checkout">Checkout</option>
          <option value="return_ticket">Return</option>
        </select>
        <select
          value={props.params.status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ISSUED">Issued</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CLOSED">Closed</option>
        </select>
        <form
          onSubmit={(e) => { e.preventDefault(); updateParams({ q: search.trim() || undefined }); }}
          className="flex-1 min-w-[200px] flex relative"
        >
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Ticket ID, Asset, Project, Reporter..."
            className="flex-1 h-8 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm bg-transparent"
          />
        </form>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 ${selected ? "lg:mr-96" : ""}`}>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                    <th className="px-4 py-3 text-left font-medium">Ticket ID</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Related Asset</th>
                    <th className="px-4 py-3 text-left font-medium">Project</th>
                    <th className="px-4 py-3 text-left font-medium">Reported By</th>
                    <th className="px-4 py-3 text-left font-medium">Expected Return</th>
                    <th className="px-4 py-3 text-left font-medium">Priority</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t) => (
                    <tr
                      key={`${t.type}-${t.id}`}
                      onClick={() => setSelectedTicket(t)}
                      className={`border-b border-[var(--border)] hover:bg-[var(--surface-1)] cursor-pointer ${selected?.id === t.id && selected?.type === t.type ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium">{t.ticketId}</td>
                      <td className="px-4 py-3">{TYPE_LABELS[t.type]}</td>
                      <td className="px-4 py-3">
                        {t.assetId ? (
                          <Link href={`/assets/${t.assetId}`} onClick={(e) => e.stopPropagation()} className="text-[var(--brand-dark-blue)] hover:underline">
                            {t.toolTag}
                          </Link>
                        ) : (
                          t.toolTag
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-2)]">{t.project}</td>
                      <td className="px-4 py-3">{t.raisedBy}</td>
                      <td className="px-4 py-3">{t.expectedReturn ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                          {t.status === "OVERDUE" ? "High" : "Normal"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTicket(t)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginated.length === 0 && (
              <div className="py-12 text-center text-[var(--text-2)]">No tickets found</div>
            )}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-sm">
                <span className="text-[var(--text-2)]">
                  {start + 1}–{Math.min(start + props.pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={props.page <= 1} onClick={() => updateParams({ page: String(props.page - 1) })}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2">Page {props.page} of {totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={props.page >= totalPages} onClick={() => updateParams({ page: String(props.page + 1) })}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Tickets by Type</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={props.typeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#005691" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Status Distribution</h3>
              <div className="h-40 flex items-center gap-4">
                <div className="w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={props.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {props.statusData.map((_, i) => (
                          <Cell key={i} fill={props.statusData[i]?.color ?? CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm">
                  {props.statusData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 py-0.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}: {s.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selected && (
          <div className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-[var(--border)] bg-[var(--surface-0)] shadow-xl flex flex-col lg:static lg:z-0 lg:shadow-none overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <h3 className="font-semibold">{selected.ticketId} — {TYPE_LABELS[selected.type]}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs text-[var(--text-2)]">Description / Purpose</p>
                <p className="font-medium">{selected.purpose ?? selected.raisedBy ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Related Asset</p>
                {selected.assetId ? (
                  <Link href={`/assets/${selected.assetId}`} className="font-medium text-[var(--brand-dark-blue)] hover:underline">
                    {selected.toolTag} — {selected.toolName}
                  </Link>
                ) : (
                  <p className="font-medium">{selected.toolTag} — {selected.toolName}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Project / Department</p>
                <p className="font-medium">{selected.project} / {selected.department}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Reported By</p>
                <p className="font-medium">{selected.raisedBy}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Issue Date</p>
                <p className="font-medium">{selected.issueDate ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Expected Return</p>
                <p className="font-medium">{selected.expectedReturn ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Condition</p>
                <p className="font-medium">{selected.condition ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Status</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              {/* Issue Request - Pending approval */}
              {selected.type === "issue_request" && selected.status === "PENDING" && props.canApprove && (
                <div className="pt-4 space-y-2 border-t border-[var(--border)]">
                  <p className="text-sm font-medium">Approve or Reject</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveIssue(selected.id, "APPROVE")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleApproveIssue(selected.id, "REJECT")} disabled={loading}>
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Return ticket - Pending approval */}
              {selected.type === "return_ticket" && selected.status === "PENDING" && props.canApprove && selected.returnTicketId && (
                <div className="pt-4 space-y-3 border-t border-[var(--border)]">
                  <p className="text-sm font-medium">Approve Return</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant={returnDecision === "APPROVE" ? "primary" : "outline"} onClick={() => setReturnDecision("APPROVE")}>Approve</Button>
                    <Button size="sm" variant={returnDecision === "REJECT" ? "destructive" : "outline"} onClick={() => setReturnDecision("REJECT")}>Reject</Button>
                  </div>
                  {returnDecision === "APPROVE" && (
                    <div>
                      <Label className="text-xs">Asset state after return</Label>
                      <select className="w-full mt-1 h-8 rounded border border-[var(--border)] px-2 text-sm" value={assetState} onChange={(e) => setAssetState(e.target.value as typeof assetState)}>
                        <option value="IN_SERVICE">In Service</option>
                        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                        <option value="QUARANTINED">Quarantined</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows={2} className="mt-1 text-sm" />
                  </div>
                  <Button onClick={() => handleApproveReturn(selected.returnTicketId!)} disabled={loading}>
                    {loading ? "..." : "Submit"}
                  </Button>
                </div>
              )}

              {/* Checkout - ISSUED or OVERDUE: Initiate Return (for anyone with checkout permission) */}
              {selected.type === "checkout" && (selected.status === "ISSUED" || selected.status === "OVERDUE") && props.canReturn && selected.assetId && (
                <div className="pt-4 space-y-2 border-t border-[var(--border)]">
                  <p className="text-sm font-medium">Return the tool</p>
                  <Button onClick={() => handleReturn(selected.assetId!)} disabled={loading} className="w-full">
                    {loading ? "..." : "Initiate Return"}
                  </Button>
                </div>
              )}

              {/* Checkout - OVERDUE: Admin can close */}
              {selected.type === "checkout" && selected.status === "OVERDUE" && props.canClose && (
                <div className="pt-4 space-y-3 border-t border-[var(--border)]">
                  <p className="text-sm font-medium">Admin: Close ticket (e.g. tool returned offline)</p>
                  <div>
                    <Label className="text-xs">Close reason (required)</Label>
                    <Textarea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="e.g. Tool returned late, no action needed" rows={2} className="mt-1 text-sm" />
                  </div>
                  <Button onClick={() => handleCloseCheckout(selected.id)} disabled={loading || !closeReason.trim()} variant="outline" className="w-full">
                    {loading ? "..." : "Close Ticket"}
                  </Button>
                </div>
              )}

              {/* Convert to Work Order */}
              {selected.assetId && props.canCreateWO && (selected.type === "checkout" || selected.type === "return_ticket") && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/work-orders/new?assetId=${selected.assetId}`}>
                      <Wrench className="h-4 w-4 mr-2" />
                      Convert to Work Order
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
