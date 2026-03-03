"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#005691", "#008ECF", "#E20015", "#F5A623", "#78BE20", "#BFC0C2"];

type Props = {
  kpis: {
    totalAssets: number;
    activeCheckouts: number;
    maintenanceBacklog: number;
    calibrationCompliance: number;
    utilizationRate: number;
    netBookValue: number;
  };
  maintenanceByPriority: { priority: string; count: number }[];
  lifecycleDistribution: { name: string; value: number }[];
  lifecycleDistributionWithPct: { name: string; value: number; pct: number }[];
  utilizationTrend: { month: string; rate: number }[];
  alerts: { label: string; count: number; href: string; severity: "warning" | "critical" }[];
  recentActivity: { type: string; id: string; user: string; at: string }[];
};

export function DashboardClient(props: Props) {
  const { kpis, alerts } = props;

  return (
    <div className="space-y-4">
      {/* KPI Tiles - compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPITile title="Total Tools" value={kpis.totalAssets.toLocaleString()} color="text-blue-600" />
          <KPITile title="Active Checkouts" value={kpis.activeCheckouts.toString()} color="text-gray-900" />
          <KPITile title="Maintenance Backlog" value={kpis.maintenanceBacklog.toString()} color="text-amber-600" />
          <KPITile title="Calibration Compliance" value={`${kpis.calibrationCompliance}%`} color="text-emerald-600" />
          <KPITile title="Utilization Rate" value={`${kpis.utilizationRate}%`} color={kpis.utilizationRate > 80 ? "text-red-600" : "text-gray-900"} />
          <KPITile title="Net Book Value" value={kpis.netBookValue >= 1e6 ? `$${(kpis.netBookValue / 1e6).toFixed(1)}M` : `$${kpis.netBookValue.toLocaleString()}`} color="text-gray-900" />
      </div>

      {/* Charts + Alerts + Activity - compact 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Utilization Trend">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={props.utilizationTrend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#008ECF" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#008ECF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Utilization"]} />
                      <Area type="monotone" dataKey="rate" stroke="#008ECF" fill="url(#utilGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title="Maintenance Backlog by Priority">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={props.maintenanceByPriority} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="priority" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          <ChartCard title="Asset Status Distribution">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={props.lifecycleDistributionWithPct}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
                  <Bar dataKey="pct" fill="#005691" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Alerts & Recent Activity */}
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-900 text-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Alerts & Risks</h3>
              </div>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-blue-200 text-sm">No critical alerts</p>
                ) : (
                  alerts.map((a, i) => (
                    <Link
                      key={i}
                      href={a.href}
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        a.severity === "critical"
                          ? "bg-red-600/30 hover:bg-red-600/50"
                          : "bg-amber-500/20 hover:bg-amber-500/30"
                      }`}
                    >
                      ! {a.count} {a.label}
                    </Link>
                  ))
                )}
              </div>
            </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2 text-sm">
              {props.recentActivity.length === 0 ? (
                <p className="text-gray-500">No recent activity</p>
              ) : (
                props.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                      {a.type.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-700">{a.type}</span>
                      <span className="text-gray-500 ml-1">· {a.id}</span>
                      <p className="text-xs text-gray-500">{a.user} · {a.at}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function KPITile({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
