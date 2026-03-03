"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalibrationCertUpload } from "./calibration-cert-upload";
import { CalibrationDatesForm } from "./calibration-dates-form";
import { format } from "date-fns";

type CalWithAsset = {
  id: string;
  performedDate: Date | null;
  nextDueDate: Date | null;
  result: string;
  certificateUrl: string | null;
  asset: {
    id: string;
    assetTag: string;
    locationPath: string | null;
    location: { name: string } | null;
    assetType: { name: string };
  };
};

function getStatus(nextDue: Date | null): "Valid" | "Due" | "Overdue" {
  if (!nextDue) return "Valid";
  const d = new Date(nextDue);
  const now = new Date();
  if (d < now) return "Overdue";
  const in30 = new Date(now.getTime() + 30 * 86400000);
  if (d <= in30) return "Due";
  return "Valid";
}

const STATUS_COLORS: Record<string, string> = {
  Valid: "bg-emerald-100 text-emerald-800",
  Due: "bg-amber-100 text-amber-800",
  Overdue: "bg-red-100 text-red-800",
};

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Valid, Due, Overdue

type Props = {
  items: CalWithAsset[];
  kpis: {
    total: number;
    dueIn30: number;
    overdue: number;
    oot: number;
    compliance: number;
  };
  statusCounts: { name: string; value: number; color: string }[];
  assetTypes: { id: string; name: string }[];
  canWrite: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  params: Record<string, string | undefined>;
};

export function CalibrationClient(props: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(props.params.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const totalPages = Math.ceil(props.totalCount / props.pageSize) || 1;
  const start = props.totalCount === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const end = Math.min(props.page * props.pageSize, props.totalCount);
  const selected = selectedId ? props.items.find((c) => c.id === selectedId) : null;

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(props.params as Record<string, string>);
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/calibration?${p.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search.trim() || undefined, page: undefined });
  }

  const toggleBulk = (id: string) => {
    const next = new Set(bulkIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBulkIds(next);
  };

  const toggleBulkAll = () => {
    if (bulkIds.size === props.items.length) setBulkIds(new Set());
    else setBulkIds(new Set(props.items.map((c) => c.id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Calibration &amp; Metrology Control</h1>
        <div className="flex items-center gap-2">
          {props.canWrite && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/assets?calibration=1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Calibration
                </Link>
              </Button>
              {bulkIds.size > 0 && (
                <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                  Bulk Update ({bulkIds.size})
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-[var(--text-2)]">Total Calibrated</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-600">{props.kpis.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-[var(--text-2)]">Due in 30 Days</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-600">{props.kpis.dueIn30}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-[var(--text-2)]">Overdue</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">{props.kpis.overdue}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-[var(--text-2)]">OOT Events</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-600">{props.kpis.oot}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-2)]">On-Time Compliance</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{props.kpis.compliance}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={props.params.assetType ?? ""}
          onChange={(e) => updateParams({ assetType: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">All Asset Types</option>
          {props.assetTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={props.params.status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="">Calibration Status</option>
          <option value="Valid">Valid</option>
          <option value="Due">Due</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Main layout: Table + Sidebar */}
      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 ${selected ? "lg:mr-96" : ""}`}>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
            <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
              <h2 className="font-semibold">Calibration Table</h2>
              <form onSubmit={handleSearch} className="flex-1 flex relative max-w-xs">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Tool ID..."
                  className="flex-1 h-8 pl-9 pr-4 rounded-md border border-[var(--border)] text-sm bg-transparent"
                />
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
                    {props.canWrite && (
                      <th className="px-4 py-3 text-left w-10">
                        <input type="checkbox" checked={bulkIds.size > 0 && bulkIds.size === props.items.length} onChange={toggleBulkAll} />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-medium">Tool ID</th>
                    <th className="px-4 py-3 text-left font-medium">Asset Type</th>
                    <th className="px-4 py-3 text-left font-medium">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Last Calibration</th>
                    <th className="px-4 py-3 text-left font-medium">Next Due</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">OOT</th>
                    <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {props.items.map((c) => {
                    const status = getStatus(c.nextDueDate);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`border-b border-[var(--border)] hover:bg-[var(--surface-1)] cursor-pointer ${selectedId === c.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                      >
                        {props.canWrite && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={bulkIds.has(c.id)} onChange={() => toggleBulk(c.id)} />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="font-medium text-[var(--brand-dark-blue)]">{c.asset.assetTag}</span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-2)]">{c.asset.assetType.name}</td>
                        <td className="px-4 py-3 text-[var(--text-2)]">{c.asset.locationPath ?? c.asset.location?.name ?? "—"}</td>
                        <td className="px-4 py-3">{c.performedDate ? format(new Date(c.performedDate), "dd MMM yyyy") : "—"}</td>
                        <td className="px-4 py-3">{c.nextDueDate ? format(new Date(c.nextDueDate), "dd MMM yyyy") : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{c.result === "OOT" ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {c.certificateUrl ? (
                            <a href={`/api/calibration/${c.id}/cert`} download className="text-[var(--brand-dark-blue)] hover:underline text-xs">
                              View PDF
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {props.items.length === 0 && (
              <div className="py-12 text-center text-[var(--text-2)]">No calibration records found</div>
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
                  <span className="text-[var(--text-2)]">
                    {props.totalCount === 0 ? "0 of 0" : `${start}–${end} of ${props.totalCount}`}
                  </span>
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

          {/* Status Distribution Chart */}
          <div className="mt-6 rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
            <h3 className="font-semibold mb-3">Status Distribution</h3>
            <div className="flex items-center gap-6">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={props.statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {props.statusCounts.map((_, i) => (
                        <Cell key={i} fill={props.statusCounts[i]?.color ?? CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 text-sm text-[var(--text-2)]">
                {props.statusCounts.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 py-1">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}: {s.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selected && (
          <div className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-[var(--border)] bg-[var(--surface-0)] shadow-xl flex flex-col lg:static lg:z-0 lg:shadow-none">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold">{selected.asset.assetTag} — {selected.asset.assetType.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs text-[var(--text-2)]">Tool ID</p>
                <p className="font-medium">{selected.asset.assetTag}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Asset Type</p>
                <p className="font-medium">{selected.asset.assetType.name}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Current Location</p>
                <p className="font-medium">{selected.asset.locationPath ?? selected.asset.location?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Last Calibration</p>
                <p className="font-medium">{selected.performedDate ? format(new Date(selected.performedDate), "dd MMM yyyy") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Next Due</p>
                <p className="font-medium">{selected.nextDueDate ? format(new Date(selected.nextDueDate), "dd MMM yyyy") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-2)]">Result</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${selected.result === "PASS" ? "bg-emerald-100 text-emerald-800" : selected.result === "OOT" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                  {selected.result}
                </span>
              </div>
              {selected.certificateUrl && (
                <div>
                  <a href={`/api/calibration/${selected.id}/cert`} download className="inline-flex items-center gap-1 text-[var(--brand-dark-blue)] hover:underline">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </a>
                </div>
              )}
              {props.canWrite && (
                <div className="pt-4 space-y-3 border-t border-[var(--border)]">
                  <CalibrationDatesForm
                    calibrationId={selected.id}
                    performedDate={selected.performedDate?.toISOString?.() ?? null}
                    nextDueDate={selected.nextDueDate?.toISOString?.() ?? null}
                    canWrite={props.canWrite}
                  />
                  <CalibrationCertUpload calibrationId={selected.id} assetTag={selected.asset.assetTag} hasCert={!!selected.certificateUrl} />
                  <Button asChild className="w-full bg-[var(--brand-dark-blue)]">
                    <Link href={`/assets/${selected.asset.id}`}>
                      View Asset Details →
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
