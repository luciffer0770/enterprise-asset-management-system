"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkOrder, Asset, AssetType, User } from "@prisma/client";

type WOWithRelations = WorkOrder & {
  asset: Asset & { assetType: AssetType };
  assignedTo: User | null;
};

const COLUMNS = [
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "ON_HOLD", label: "On Hold" },
  { key: "COMPLETED", label: "Completed" },
];

export function WorkOrdersKanban({
  workOrders,
  canWrite,
}: {
  workOrders: WOWithRelations[];
  canWrite: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = workOrders.filter((wo) => wo.status === col.key);
        return (
          <div
            key={col.key}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              {col.label}
              <Badge variant="neutral">{items.length}</Badge>
            </h3>
            <div className="space-y-2">
              {items.map((wo) => (
                <Card key={wo.id}>
                  <CardContent className="p-3">
                    <Link
                      href={`/work-orders/${wo.id}`}
                      className="font-medium text-sm text-[var(--brand-dark-blue)] hover:underline"
                    >
                      {wo.title}
                    </Link>
                    <p className="text-xs text-[var(--text-2)] mt-1">
                      {wo.asset.assetTag} — {wo.type}
                    </p>
                    <Badge variant="info" className="mt-1 text-xs">
                      {wo.priority}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
