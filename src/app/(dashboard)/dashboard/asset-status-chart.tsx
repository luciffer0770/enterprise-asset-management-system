"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  IN_SERVICE: "var(--status-available)",
  CHECKED_OUT: "var(--brand-dark-blue)",
  RETURN_PENDING: "var(--status-maintenance)",
  UNDER_MAINTENANCE: "var(--status-maintenance)",
  RESERVED: "var(--status-trolley)",
  QUARANTINED: "var(--status-issued)",
  other: "var(--neutral-dark)",
};

function getColor(key: string) {
  return COLORS[key] ?? COLORS.other;
}

export function AssetStatusChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, "Assets"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
