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
} from "recharts";
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from "date-fns";

type ResWithRelations = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  assetId: string | null;
  asset: { assetTag: string; assetType: { name: string }; project?: { name: string } } | null;
  requester: { displayName: string };
};

function hasConflict(r: ResWithRelations, all: ResWithRelations[]): ResWithRelations | null {
  if (!r.assetId || !["PENDING", "CONFIRMED"].includes(r.status)) return null;
  const overlapping = all.find(
    (o) =>
      o.id !== r.id &&
      o.assetId === r.assetId &&
      ["PENDING", "CONFIRMED"].includes(o.status) &&
      new Date(o.startDate) < new Date(r.endDate) &&
      new Date(o.endDate) > new Date(r.startDate)
  );
  return overlapping ?? null;
}

function isOverdue(r: ResWithRelations): boolean {
  return ["PENDING", "CONFIRMED"].includes(r.status) && new Date(r.endDate) < new Date();
}

const CHART_COLORS = ["#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#6366f1"];

type Props = {
  reservations: ResWithRelations[];
  kpis: { active: number; upcoming: number; conflicts: number; overdue: number };
  projectData: { name: string; value: number }[];
  statusData: { name: string; value: number; color: string }[];
  canWrite: boolean;
  month: string;
};

export function ReservationsClient(props: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const baseMonth = props.month ? new Date(props.month + "-01") : new Date();
  const monthStart = startOfMonth(baseMonth);
  const days = Array.from({ length: 14 }, (_, i) => addDays(monthStart, i));

  const selected = selectedId ? props.reservations.find((r) => r.id === selectedId) : null;
  const selectedConflict = selected ? hasConflict(selected, props.reservations) : null;

  function prevMonth() {
    const d = new Date(baseMonth);
    d.setMonth(d.getMonth() - 1);
    router.push(`/reservations?month=${d.toISOString().slice(0, 7)}`);
  }
  function nextMonth() {
    const d = new Date(baseMonth);
    d.setMonth(d.getMonth() + 1);
    router.push(`/reservations?month=${d.toISOString().slice(0, 7)}`);
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this reservation?")) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSelectedId(null);
      router.refresh();
    } catch {
      alert("Failed to cancel");
    }
  }

  async function handleExport() {
    const res = await fetch(`/api/reservations/export?month=${props.month}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reservations-${props.month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const inRange = (r: ResWithRelations, d: Date) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return isWithinInterval(d, { start, end }) || isSameDay(start, d) || isSameDay(end, d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reservation Management</h1>
        <div className="flex items-center gap-2">
          {props.canWrite && (
            <Button asChild className="bg-[var(--brand-dark-blue)]">
              <Link href="/reservations/new">
                <Plus className="h-4 w-4 mr-2" />
                New Reservation
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Calendar
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
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-[var(--text-2)]">Active Reservations</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-600">{props.kpis.active}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-2)]">Upcoming (Next 7 Days)</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{props.kpis.upcoming}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-[var(--text-2)]">Conflicts</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.conflicts}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-[var(--text-2)]">Overdue</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-600">{props.kpis.overdue}</p>
        </div>
      </div>

      {/* View toggle + Calendar nav */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant={view === "calendar" ? "primary" : "outline"} size="sm" onClick={() => setView("calendar")}>
            Calendar
          </Button>
          <Button variant={view === "list" ? "primary" : "outline"} size="sm" onClick={() => setView("list")}>
            List
          </Button>
        </div>
        {view === "calendar" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">{format(baseMonth, "MMMM yyyy")}</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 ${selected ? "lg:mr-96" : ""}`}>
          {view === "calendar" ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                      <th className="w-40 px-4 py-3 text-left font-medium">Tool / Requester</th>
                      {days.map((d) => (
                        <th
                          key={d.toISOString()}
                          className={`min-w-[80px] text-center py-3 font-medium text-xs ${isSameDay(d, new Date()) ? "bg-blue-100 dark:bg-blue-950/30" : ""}`}
                        >
                          {format(d, "EEE d")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {props.reservations.slice(0, 30).map((r) => {
                      const conflict = hasConflict(r, props.reservations);
                      const overdue = isOverdue(r);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`border-b border-[var(--border)] hover:bg-[var(--surface-1)] cursor-pointer ${selectedId === r.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium">{r.asset?.assetTag ?? "—"}</div>
                            <div className="text-xs text-[var(--text-2)]">{r.requester.displayName}</div>
                          </td>
                          {days.map((d) => {
                            const cellInRange = inRange(r, d);
                            return (
                              <td
                                key={d.toISOString()}
                                className={`text-center py-2 ${cellInRange ? (conflict || overdue ? "bg-red-100 dark:bg-red-950/30" : "bg-emerald-100 dark:bg-emerald-950/30") : ""}`}
                              >
                                {cellInRange ? (
                                  <span className={`text-xs px-1 py-0.5 rounded ${conflict || overdue ? "bg-red-200 text-red-800" : "bg-emerald-200 text-emerald-800"}`}>
                                    {r.status}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {props.reservations.length === 0 && (
                <div className="py-12 text-center text-[var(--text-2)]">No reservations in this period</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                      <th className="px-4 py-3 text-left font-medium">Reservation ID</th>
                      <th className="px-4 py-3 text-left font-medium">Tool</th>
                      <th className="px-4 py-3 text-left font-medium">Project</th>
                      <th className="px-4 py-3 text-left font-medium">Reserved By</th>
                      <th className="px-4 py-3 text-left font-medium">Start</th>
                      <th className="px-4 py-3 text-left font-medium">End</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Conflict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.reservations.map((r) => {
                      const conflict = hasConflict(r, props.reservations);
                      const overdue = isOverdue(r);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`border-b border-[var(--border)] hover:bg-[var(--surface-1)] cursor-pointer ${selectedId === r.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                        >
                          <td className="px-4 py-3 font-mono text-xs">RESV-{r.id.slice(-6).toUpperCase()}</td>
                          <td className="px-4 py-3">
                            {r.asset ? (
                              <Link href={`/assets/${r.assetId}`} onClick={(e) => e.stopPropagation()} className="text-[var(--brand-dark-blue)] hover:underline">
                                {r.asset.assetTag} — {r.asset.assetType.name}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-2)]">{r.asset?.project?.name ?? "—"}</td>
                          <td className="px-4 py-3">{r.requester.displayName}</td>
                          <td className="px-4 py-3">{format(new Date(r.startDate), "dd MMM HH:mm")}</td>
                          <td className="px-4 py-3">{format(new Date(r.endDate), "dd MMM HH:mm")}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                overdue ? "bg-red-100 text-red-800" : conflict ? "bg-red-100 text-red-800" : r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {overdue ? "Overdue" : r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {conflict ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {props.reservations.length === 0 && (
                <div className="py-12 text-center text-[var(--text-2)]">No reservations found</div>
              )}
            </div>
          )}

          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
              <h3 className="font-semibold mb-3">Reservations by Project</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={props.projectData}>
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
              <h3 className="font-semibold">RESV-{selected.id.slice(-6).toUpperCase()}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              {selectedConflict && (
                <div className="rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-300 p-3 text-sm text-red-800 dark:text-red-200">
                  <strong>Conflict:</strong> Overlaps RESV-{selectedConflict.id.slice(-6).toUpperCase()} by {selectedConflict.requester.displayName}
                </div>
              )}
              {isOverdue(selected) && !selectedConflict && (
                <div className="rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-300 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <strong>Overdue:</strong> End date has passed
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--text-2)]">Tool</p>
                {selected.assetId ? (
                  <Link href={`/assets/${selected.assetId}`} className="font-medium text-[var(--brand-dark-blue)] hover:underline">
                    {selected.asset?.assetTag} — {selected.asset?.assetType.name}
                  </Link>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Project</p>
                <p className="font-medium">{selected.asset?.project?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Requested By</p>
                <p className="font-medium">{selected.requester.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Start</p>
                <p className="font-medium">{format(new Date(selected.startDate), "dd MMM yyyy HH:mm")}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">End</p>
                <p className="font-medium">{format(new Date(selected.endDate), "dd MMM yyyy HH:mm")}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isOverdue(selected) ? "bg-red-100 text-red-800" : selected.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isOverdue(selected) ? "Overdue" : selected.status}
                </span>
              </div>
              {props.canWrite && ["PENDING", "CONFIRMED"].includes(selected.status) && (
                <div className="pt-4 space-y-2 border-t border-[var(--border)]">
                  {selected.assetId && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/tickets?q=${encodeURIComponent(selected.asset?.assetTag ?? "")}`}>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Convert to Checkout
                      </Link>
                    </Button>
                  )}
                  <Button variant="destructive" className="w-full" onClick={() => handleCancel(selected.id)}>
                    Cancel Reservation
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
