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
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
        <h3 className="font-semibold mb-4">Tools by Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusCounts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-0)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              />
              <Bar dataKey="count" fill="var(--brand-dark-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-0)]">
        <h3 className="font-semibold mb-4">Ticket Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ticketCounts}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {ticketCounts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-0)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
