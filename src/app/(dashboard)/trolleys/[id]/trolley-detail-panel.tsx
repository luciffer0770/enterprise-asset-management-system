"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PoolData = {
  id: string;
  name: string;
  code: string | null;
  kind: string | null;
  isActive: boolean;
  projectName: string | null;
  toolCount: number;
  assets: {
    id: string;
    assetTag: string;
    assetTypeName: string;
    status: string;
    ownership: string;
  }[];
};

type AssetOption = { id: string; assetTag: string; assetTypeName: string };

export function TrolleyDetailPanel({
  pool,
  availableAssets,
  canWrite,
}: {
  pool: PoolData;
  availableAssets: AssetOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [loading, setLoading] = useState(false);

  const code = pool.code ?? `TR-${pool.id.slice(-4).toUpperCase()}`;

  async function handleAssign() {
    if (!selectedAssetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${selectedAssetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: pool.id }),
      });
      if (!res.ok) throw new Error("Failed");
      setSelectedAssetId("");
      router.refresh();
    } catch {
      alert("Failed to assign tool");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(assetId: string) {
    if (!confirm("Remove this tool from the trolley?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: null }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Failed to remove tool");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-semibold text-[var(--text-0)] mb-1">
              {pool.name}
            </h2>
            <p className="text-sm text-[var(--text-2)]">
              {code} • {pool.isActive ? "Active" : "Inactive"}
              {pool.projectName && ` • ${pool.projectName}`}
              {pool.kind && ` • ${pool.kind}`}
            </p>
            <p className="text-sm text-[var(--text-2)] mt-2">
              {pool.toolCount} Tools
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--surface-2)]">
            <h3 className="font-medium text-[var(--text-0)] mb-3">Assign Tool</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-[var(--text-2)] block mb-1">Select tool</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
                >
                  <option value="">Select tool...</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetTag} — {a.assetTypeName}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={handleAssign}
                disabled={!selectedAssetId || loading}
                className="bg-[var(--brand-dark-blue)] hover:opacity-90"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold text-[var(--text-0)] mb-3">Tools inside</h3>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="industrial-table w-full">
              <thead>
                <tr>
                  <th>Tool ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Ownership</th>
                  {canWrite && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pool.assets.length === 0 ? (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="text-center py-6 text-[var(--text-2)]">
                      No tools assigned. Use Assign Tool above to add tools.
                    </td>
                  </tr>
                ) : (
                  pool.assets.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-sm">
                        <Link href={`/assets/${a.id}`} className="text-[var(--brand-dark-blue)] hover:underline">
                          {a.assetTag}
                        </Link>
                      </td>
                      <td>{a.assetTypeName}</td>
                      <td>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === "IN_SERVICE"
                              ? "bg-[var(--status-available)]/20 text-[var(--status-available)]"
                              : a.status === "CHECKED_OUT"
                                ? "bg-[var(--status-issued)]/20 text-[var(--status-issued)]"
                                : "bg-[var(--neutral-dark)]/20 text-[var(--text-2)]"
                          }`}
                        >
                          {a.status === "CHECKED_OUT" ? "In Use" : a.status === "IN_SERVICE" ? "Available" : a.status}
                        </span>
                      </td>
                      <td>{a.ownership}</td>
                      {canWrite && (
                        <td>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error)]/10"
                            onClick={() => handleRemove(a.id)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
