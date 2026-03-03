"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  AlertTriangle,
  Package,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type EventWithActor = {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  eventTs: Date;
  diffJson: string;
  ipAddress: string | null;
  actor: { displayName: string; role: string } | null;
};

function getRiskLevel(action: string): "Low" | "Medium" | "High" {
  if (["DELETE", "TICKET_REJECTED", "REJECT"].includes(action)) return "High";
  if (["UPDATE", "CLOSE", "TICKET_APPROVED", "APPROVE"].includes(action)) return "Medium";
  return "Low";
}

function formatDiff(diff: Record<string, unknown>): { prev: string; next: string } {
  const keys = Object.keys(diff).filter((k) => !["created", "errors"].includes(k));
  if (keys.length === 0) return { prev: "—", next: "—" };
  let prev = "";
  let next = "";
  for (const k of keys) {
    const v = diff[k];
    if (v && typeof v === "object" && "from" in v && "to" in v) {
      const f = (v as { from: unknown; to: unknown });
      prev = prev ? `${prev}; ${String(f.from)}` : String(f.from);
      next = next ? `${next}; ${String(f.to)}` : String(f.to);
    } else {
      const s = String(v);
      prev = prev ? `${prev}; ${s}` : s;
      next = next ? `${next}; ${s}` : s;
    }
  }
  return { prev: prev || "—", next: next || "—" };
}

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

type Props = {
  events: EventWithActor[];
  users: string[];
  kpis: {
    total: number;
    critical: number;
    assetChanges: number;
    pendingCompliance: number;
  };
  trendData: { date: string; count: number }[];
  moduleData: { name: string; value: number }[];
  riskData: { name: string; value: number; color: string }[];
  totalCount: number;
  page: number;
  pageSize: number;
  params: Record<string, string | undefined>;
};

export function AuditClient(props: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(props.params.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const totalPages = Math.ceil(props.totalCount / props.pageSize) || 1;
  const start = props.totalCount === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const end = Math.min(props.page * props.pageSize, props.totalCount);
  const selected = selectedId ? props.events.find((e) => e.id === selectedId) : null;

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(props.params as Record<string, string>);
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/audit-logs?${p.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search.trim() || undefined, page: undefined });
  }

  async function handleExport() {
    const res = await fetch(`/api/audit-logs/export?${new URLSearchParams(props.params as Record<string, string>).toString()}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Audit Log &amp; Compliance</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Audit Report
          </Button>
          <Button variant="outline" size="sm" disabled title="Compliance report (coming soon)">
            Generate Compliance Report
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-[var(--text-2)]">Total Logged Events</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-600">{props.kpis.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-[var(--text-2)]">Critical Changes</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.critical}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-2)]">Asset State Changes</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{props.kpis.assetChanges}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-[var(--text-2)]">High Risk Events</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-600">{props.kpis.pendingCompliance}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={props.params.user ?? ""}
          onChange={(e) => updateParams({ user: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Users</option>
          {props.users.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          value={props.params.module ?? ""}
          onChange={(e) => updateParams({ module: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Modules</option>
          <option value="Asset">Asset</option>
          <option value="Trolley">Trolley</option>
          <option value="WorkOrder">Work Order</option>
          <option value="Checkout">Checkout</option>
          <option value="Reservation">Reservation</option>
          <option value="IssueRequest">Issue Request</option>
          <option value="ReturnTicket">Return Ticket</option>
          <option value="CalibrationEvent">Calibration</option>
        </select>
        <select
          value={props.params.action ?? ""}
          onChange={(e) => updateParams({ action: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Action Types</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="CHECKOUT">Checkout</option>
          <option value="RETURN">Return</option>
          <option value="CLOSE">Close</option>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="IMPORT">Import</option>
        </select>
        <select
          value={props.params.risk ?? ""}
          onChange={(e) => updateParams({ risk: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Risk Levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Asset/Trolley/Reservation ID..."
            className="flex-1 h-8 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm bg-transparent"
          />
        </form>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 ${selected ? "lg:mr-96" : ""}`}>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
              <h2 className="font-semibold">Audit Log</h2>
              <span className="text-sm text-[var(--text-2)]">
                {props.totalCount === 0 ? "0 of 0" : `${start}–${end} of ${props.totalCount}`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                    <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Module</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Object ID</th>
                    <th className="px-4 py-3 text-left font-medium">Previous / New Value</th>
                    <th className="px-4 py-3 text-left font-medium">Risk</th>
                    <th className="px-4 py-3 text-left font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {props.events.map((e) => {
                    let diff: Record<string, unknown> = {};
                    try {
                      diff = JSON.parse(e.diffJson) as Record<string, unknown>;
                    } catch {}
                    const { prev, next } = formatDiff(diff);
                    const risk = getRiskLevel(e.action);
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedId(e.id)}
                        className={`border-b border-[var(--border)] hover:bg-[var(--surface-1)] cursor-pointer ${selectedId === e.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(e.eventTs), "dd MMM yyyy HH:mm")}</td>
                        <td className="px-4 py-3">{e.actor?.displayName ?? "System"}</td>
                        <td className="px-4 py-3 text-[var(--text-2)]">{e.actor?.role ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{e.entityType}</td>
                        <td className="px-4 py-3">{e.action}</td>
                        <td className="px-4 py-3 font-mono text-xs">{e.entityId ? e.entityId.slice(0, 12) + (e.entityId.length > 12 ? "…" : "") : "—"}</td>
                        <td className="px-4 py-3 text-[var(--text-2)] max-w-[180px] truncate">
                          {prev !== next ? `${prev} → ${next}` : prev}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[risk]}`}>
                            {risk}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">{e.ipAddress ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {props.events.length === 0 && (
              <div className="py-12 text-center text-[var(--text-2)]">No audit events found</div>
            )}

            {props.totalCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-2)]">Rows per page:</span>
                  <select
                    value={props.pageSize}
                    onChange={(e) => updateParams({ pageSize: e.target.value, page: "1" })}
                    className="h-8 rounded border border-[var(--border)] px-2 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
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
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Audit Events Trend (Last 30 Days)</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={props.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#005691" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Changes by Module</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={props.moduleData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#005691" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Risk Level Distribution</h3>
              <div className="h-40 flex items-center gap-4">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={props.riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {props.riskData.map((_, i) => (
                          <Cell key={i} fill={props.riskData[i]?.color ?? CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm">
                  {props.riskData.map((s) => (
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
          <div className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-[var(--border)] bg-[var(--surface-0)] shadow-xl flex flex-col lg:static lg:z-0 lg:shadow-none">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold">Audit Detail</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs text-[var(--text-2)]">Event</p>
                <p className="font-medium">{selected.entityType} — {selected.action}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Object ID</p>
                <p className="font-mono text-sm">{selected.entityId ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Date &amp; Time</p>
                <p className="font-medium">{format(new Date(selected.eventTs), "dd MMM yyyy h:mm a")}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Updated By</p>
                <p className="font-medium">{selected.actor?.displayName ?? "System"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Risk</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[getRiskLevel(selected.action)]}`}>
                  {getRiskLevel(selected.action)}
                </span>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">IP Address</p>
                <p className="font-mono text-sm">{selected.ipAddress ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Change Details</p>
                <pre className="text-xs bg-[var(--surface-2)] p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selected.diffJson), null, 2);
                    } catch {
                      return selected.diffJson;
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
