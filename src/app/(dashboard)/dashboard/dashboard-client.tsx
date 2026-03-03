"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
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
import { ChevronDown, AlertTriangle } from "lucide-react";

const COLORS = ["#005691", "#008ECF", "#E20015", "#F5A623", "#78BE20", "#BFC0C2"];

type Props = {
  orgUnits: { id: string; name: string }[];
  assetTypes: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  kpis: {
    totalAssets: number;
    activeCheckouts: number;
    maintenanceBacklog: number;
    calibrationCompliance: number;
    utilizationRate: number;
    netBookValue: number;
    sparklineData: number[];
  };
  maintenanceByPriority: { priority: string; count: number }[];
  lifecycleDistribution: { name: string; value: number }[];
  teamDistribution: { team: string; total: number; inService: number }[];
  utilizationTrend: { month: string; rate: number }[];
  alerts: { label: string; count: number; href: string; severity: "warning" | "critical" }[];
  heatmapData: { orgUnit: string; mon: number; tue: number; wed: number; thu: number; fri: number; sat: number }[];
};

export function DashboardClient(props: Props) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | "all">("all");
  const [timeFilter, setTimeFilter] = useState("Last 30 Days");
  const [assetTypeFilter, setAssetTypeFilter] = useState("All Asset Types");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  const { kpis, alerts } = props;

  return (
    <div className="flex gap-6">
      {/* Left sidebar - Team filter */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Team</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedOrgId("all")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm ${
                selectedOrgId === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {props.orgUnits.map((ou) => (
              <button
                key={ou.id}
                onClick={() => setSelectedOrgId(ou.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm ${
                  selectedOrgId === ou.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {ou.name}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPITile
            title="Total Tools"
            value={kpis.totalAssets.toLocaleString()}
            color="text-blue-600"
            sparkData={kpis.sparklineData}
          />
          <KPITile
            title="Active Checkouts"
            value={kpis.activeCheckouts.toString()}
            color="text-gray-900"
            sparkData={kpis.sparklineData}
          />
          <KPITile
            title="Maintenance Backlog"
            value={kpis.maintenanceBacklog.toString()}
            color="text-amber-600"
            sparkData={kpis.sparklineData}
          />
          <KPITile
            title="Calibration Compliance"
            value={`${kpis.calibrationCompliance}%`}
            color="text-emerald-600"
            sparkData={kpis.sparklineData}
          />
          <KPITile
            title="Utilization Rate"
            value={`${kpis.utilizationRate}%`}
            color={kpis.utilizationRate > 80 ? "text-red-600" : "text-gray-900"}
            sparkData={kpis.sparklineData}
          />
          <KPITile
            title="Net Book Value"
            value={
              kpis.netBookValue >= 1e6
                ? `$${(kpis.netBookValue / 1e6).toFixed(1)}M`
                : `$${kpis.netBookValue.toLocaleString()}`
            }
            color="text-gray-900"
            sparkData={kpis.sparklineData}
          />
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
          >
            <option>All Asset Types</option>
            {props.assetTypes.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
          >
            <option>All Locations</option>
            {props.locations.map((l) => (
              <option key={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Charts + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Lifecycle Distribution">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={props.lifecycleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {props.lifecycleDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title="Tools by Department">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={props.teamDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="team" tick={{ fontSize: 10 }} width={55} />
                      <Tooltip />
                      <Bar dataKey="total" name="Total" fill="#005691" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Alerts & Risks */}
          <div className="xl:col-span-1">
            <div className="rounded-lg bg-blue-900 text-white p-4 h-full">
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
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Activity by Department & Day</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600 w-24">Department</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Mon</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Tue</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Wed</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Thu</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Fri</th>
                  <th className="py-2 px-1 text-center font-medium text-gray-600">Sat</th>
                </tr>
              </thead>
              <tbody>
                {props.heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-gray-700">{row.orgUnit}</td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.mon)}`} title={`${row.mon}`} />
                    </td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.tue)}`} />
                    </td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.wed)}`} />
                    </td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.thu)}`} />
                    </td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.fri)}`} />
                    </td>
                    <td className="py-1 px-1">
                      <div className={`w-8 h-6 rounded ${heatLevelClass(row.sat)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Green: low activity · Amber: medium · Red: high
          </p>
        </div>
      </div>
    </div>
  );
}

function heatLevelClass(v: number): string {
  if (v <= 2) return "bg-emerald-400";
  if (v <= 5) return "bg-amber-400";
  return "bg-red-500";
}

function KPITile({
  title,
  value,
  color,
  sparkData,
}: {
  title: string;
  value: string;
  color: string;
  sparkData: number[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sparkData.length > 0 && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line type="monotone" dataKey="v" stroke="#9ca3af" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
