"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

type PoolItem = {
  id: string;
  name: string;
  code: string | null;
  kind: string | null;
  isActive: boolean;
  _count: { assets: number };
  projectName?: string;
};

type AssetOption = { id: string; assetTag: string; assetType: { name: string } };

export function TrolleyTwoPanel({
  pools,
  availableAssets,
  canWrite,
}: {
  pools: PoolItem[];
  availableAssets: AssetOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(pools[0]?.id ?? "");
  const [toolId, setToolId] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPool = pools.find((p) => p.id === selectedId);

  async function handleAssignTool() {
    if (!selectedPool || !toolId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: selectedPool.id }),
      });
      if (!res.ok) throw new Error("Failed");
      setToolId("");
      router.refresh();
    } catch {
      alert("Failed to assign tool");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-0)]">Trolley</h1>
          <p className="text-sm text-[var(--text-2)] mt-0.5">
            Manage trolleys and tool assignments
          </p>
        </div>
        {canWrite && (
          <Button asChild className="bg-[var(--brand-dark-blue)] hover:opacity-90">
            <Link href="/trolleys/new">+ Add Trolley</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h2 className="font-semibold text-[var(--text-0)] mb-3">Trolleys</h2>
            <ul className="space-y-1">
              {pools.length === 0 ? (
                <li className="text-sm text-[var(--text-2)] py-2">No trolleys</li>
              ) : (
                pools.map((pool) => {
                  const isSelected = pool.id === selectedId;
                  const code = pool.code ?? `TR-${pool.id.slice(-4).toUpperCase()}`;
                  return (
                    <li key={pool.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(pool.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-[var(--brand-dark-blue)]/15 text-[var(--text-0)] border border-[var(--brand-dark-blue)]"
                            : "hover:bg-[var(--surface-2)] text-[var(--text-0)]"
                        }`}
                      >
                        <span className="font-medium block">{pool.name}</span>
                        <span className="text-xs text-[var(--text-2)]">
                          {code} • {pool.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h2 className="font-semibold text-[var(--text-0)] mb-3">
              Assign Tools to Trolley
            </h2>
            {!selectedPool ? (
              <p className="text-sm text-[var(--text-2)]">
                Select a trolley from the list to assign tools.
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="tool-select" className="text-xs text-[var(--text-2)] block mb-1">
                    Tool
                  </label>
                  <select
                    id="tool-select"
                    value={toolId}
                    onChange={(e) => setToolId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
                  >
                    <option value="">Select tool...</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.assetTag} — {a.assetType.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={handleAssignTool}
                  disabled={!toolId || loading}
                  className="bg-[var(--brand-dark-blue)] hover:opacity-90"
                >
                  Add
                </Button>
              </div>
            )}
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Use the dropdown to add a tool to the selected trolley. View details to see all
              assigned tools.
            </p>
            {selectedPool && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-2)] flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {selectedPool._count.assets} tools on this trolley
                  {selectedPool.projectName && (
                    <span className="ml-2">· {selectedPool.projectName}</span>
                  )}
                </p>
                <Button variant="ghost" size="sm" asChild className="mt-2">
                  <Link href={`/trolleys/${selectedPool.id}`}>View Details</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
