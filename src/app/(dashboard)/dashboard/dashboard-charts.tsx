"use client";

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
} from "recharts";

const COLORS = [
  "var(--brand-red)",
  "var(--brand-dark-blue)",
  "var(--brand-light-blue)",
  "var(--success)",
  "var(--warning)",
];

export function DashboardCharts({
  statusCounts,
  ticketCounts,
}: {
  statusCounts: { status: string; count: number }[];
  ticketCounts: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] shadow-sm">
        <h3 className="font-semibold mb-4 text-[var(--text-0)]">Tools by Status</h3>
        <div className="h-56">
          {statusCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                <Bar dataKey="count" fill="var(--brand-dark-blue)" radius={[4, 4, 0, 0]} name="Tools" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-2)] text-sm">No data</div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] shadow-sm">
        <h3 className="font-semibold mb-4 text-[var(--text-0)]">Tickets & Requests</h3>
        <div className="h-56">
          {ticketCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketCounts} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
                <Bar dataKey="value" fill="var(--brand-light-blue)" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-2)] text-sm">No active tickets</div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)] shadow-sm">
        <h3 className="font-semibold mb-4 text-[var(--text-0)]">Status Distribution</h3>
        <div className="h-56">
          {statusCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, count }) => `${status.slice(0, 8)}: ${count}`}
                >
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-2)] text-sm">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
