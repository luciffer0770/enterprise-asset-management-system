"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  Wrench,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WOWithRelations = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  plannedFinish: Date | null;
  createdAt: Date;
  asset: { assetTag: string; locationPath: string | null; location: { name: string } | null };
  assignedTo: { displayName: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  NORMAL: "bg-blue-100 text-blue-800",
  LOW: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-gray-100 text-gray-800",
  OVERDUE: "bg-red-100 text-red-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

type Props = {
  workOrders: WOWithRelations[];
  kpis: {
    open: number;
    criticalOverdue: number;
    pmsDue: number;
    breakdowns: number;
  };
  chartData: { month: string; corrective: number; preventive: number }[];
  scheduleData: { date: string; label: string; count: number }[];
  users: { id: string; displayName: string }[];
  canWrite: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  params: Record<string, string | undefined>;
};

export function WorkOrdersClient(props: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(props.params.q ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const totalPages = Math.ceil(props.totalCount / props.pageSize) || 1;
  const start = props.totalCount === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const end = Math.min(props.page * props.pageSize, props.totalCount);

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(props.params as Record<string, string>);
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/work-orders?${p.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search.trim() || undefined, page: undefined });
  }

  async function handleBulkStatus(status: string) {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleBulkAssign(userId: string) {
    if (selectedIds.size === 0 || !userId) return;
    for (const id of selectedIds) {
      await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === props.workOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(props.workOrders.map((w) => w.id)));
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        {props.canWrite && (
          <Button asChild className="bg-[var(--brand-dark-blue)] hover:bg-[var(--brand-dark-blue)]/90">
            <Link href="/work-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={props.params.type ?? ""}
          onChange={(e) => updateParams({ type: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">Type: All</option>
          <option value="corrective">Corrective</option>
          <option value="preventive">Preventive</option>
        </select>
        <select
          value={props.params.priority ?? ""}
          onChange={(e) => updateParams({ priority: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={props.params.status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={props.params.assignee ?? ""}
          onChange={(e) => updateParams({ assignee: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All assignees</option>
          {props.users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/work-orders?status=OPEN">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-[var(--text-2)]">Open Work Orders</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{props.kpis.open}</p>
            <div className="mt-2 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (props.kpis.open / (props.totalCount || 1)) * 100)}%` }} />
            </div>
          </div>
        </Link>
        <Link href="/work-orders?overdue=1">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-[var(--text-2)]">Critical Overdue</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.criticalOverdue}</p>
            <div className="mt-2 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (props.kpis.criticalOverdue / (props.totalCount || 1)) * 100)}%` }} />
            </div>
          </div>
        </Link>
        <Link href="/work-orders?type=preventive">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-[var(--text-2)]">PMs Due</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{props.kpis.pmsDue}</p>
            <div className="mt-2 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (props.kpis.pmsDue / (props.totalCount || 1)) * 100)}%` }} />
            </div>
          </div>
        </Link>
        <Link href="/work-orders?type=corrective">
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] hover:border-[var(--brand-dark-blue)] transition-colors">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-500" />
              <span className="text-sm text-[var(--text-2)]">Breakdowns</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.breakdowns}</p>
            <div className="mt-2 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (props.kpis.breakdowns / (props.totalCount || 1)) * 100)}%` }} />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <h3 className="font-semibold mb-3">Work Orders by Type (Last 90 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={props.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="corrective" name="Corrective" stackId="a" fill="#005691" radius={[0, 0, 0, 0]} />
                <Bar dataKey="preventive" name="Preventive" stackId="a" fill="#78BE20" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <h3 className="font-semibold mb-3">Upcoming PM Schedule</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {props.scheduleData.map((d) => (
              <div
                key={d.date}
                className="shrink-0 w-20 py-3 px-2 rounded-lg border border-[var(--border)] text-center hover:border-[var(--brand-dark-blue)] cursor-pointer"
              >
                <p className="text-xs text-[var(--text-2)]">{d.label}</p>
                <p className="text-lg font-bold text-[var(--brand-dark-blue)]">{d.count}</p>
                <p className="text-xs">PMs</p>
              </div>
            ))}
          </div>
          <Link href="/work-orders?type=preventive">
            <Button variant="outline" size="sm" className="mt-2">View All</Button>
          </Link>
        </div>
      </div>

      {/* Table + Actions */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-3 border-b border-[var(--border)]">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === props.workOrders.length}
              onChange={toggleSelectAll}
            />
            All Work Orders
          </label>
          {selectedIds.size > 0 && props.canWrite && (
            <>
              <Select onValueChange={(v) => v && handleBulkAssign(v)}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Assign" />
                </SelectTrigger>
                <SelectContent>
                  {props.users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => v && handleBulkStatus(v)}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Complete</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work orders..."
              className="flex-1 h-8 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm bg-transparent"
            />
          </form>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                <th className="px-4 py-3 text-left w-10"><input type="checkbox" checked={selectedIds.size > 0} onChange={toggleSelectAll} /></th>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Due Date</th>
                <th className="px-4 py-3 text-left font-medium">Assignee</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-right font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {props.workOrders.map((wo) => {
                const isOverdue = wo.status !== "COMPLETED" && wo.status !== "CANCELLED" && wo.plannedFinish && wo.plannedFinish < now;
                const statusDisplay = isOverdue ? "OVERDUE" : wo.status;
                return (
                  <tr key={wo.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-1)]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(wo.id)}
                        onChange={() => toggleSelect(wo.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">WO-{wo.id.slice(-4).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-[var(--brand-dark-blue)] hover:underline">
                        {wo.title}
                      </Link>
                      <p className="text-xs text-[var(--text-2)]">{wo.asset.assetTag}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wo.type === "corrective" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {wo.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[statusDisplay] ?? "bg-gray-100 text-gray-800"}`}>
                        {statusDisplay.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[wo.priority] ?? "bg-gray-100 text-gray-800"}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">
                      {wo.plannedFinish ? wo.plannedFinish.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">{wo.assignedTo?.displayName ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-2)]">
                      {wo.asset.locationPath ?? wo.asset.location?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/work-orders/${wo.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {props.workOrders.length === 0 && (
          <div className="py-12 text-center text-[var(--text-2)]">No work orders found</div>
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
                <option value={100}>100</option>
              </select>
              <span className="text-[var(--text-2)]">{props.totalCount === 0 ? "0 of 0" : `${start}–${end} of ${props.totalCount}`}</span>
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
    </div>
  );
}
