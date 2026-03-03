"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

type AssetRow = {
  id: string;
  assetTag: string;
  assetType: { name: string };
  lifecycleState: string;
  trolleyId: string | null;
};

export function TrolleyToolAssign({
  trolleyId,
  assignedTools,
  availableTools,
  canEdit,
}: {
  trolleyId: string;
  assignedTools: AssetRow[];
  availableTools: AssetRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function assignTool(assetId: string) {
    setLoading(assetId);
    try {
      const res = await fetch(`/api/trolleys/${trolleyId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to assign tool");
    } finally {
      setLoading(null);
    }
  }

  async function removeTool(assetId: string) {
    if (!confirm("Remove this tool from the trolley? It will become available for other assignments.")) return;
    setLoading(assetId);
    try {
      const res = await fetch(`/api/trolleys/${trolleyId}/assets?assetId=${encodeURIComponent(assetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Failed to remove tool");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Tools on this trolley</h3>
        <p className="text-sm text-[var(--text-2)]">
          Tools assigned to a trolley are not available in the general pool until removed.
        </p>
      </div>
      {assignedTools.length === 0 ? (
        <p className="text-[var(--text-2)]">No tools assigned.</p>
      ) : (
        <div className="space-y-2">
          {assignedTools.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-0)]"
            >
              <Link href={`/assets/${a.id}`} className="font-medium text-[var(--brand-dark-blue)] hover:underline">
                {a.assetTag} — {a.assetType.name}
              </Link>
              <Badge variant="neutral" className="shrink-0 ml-2">{a.lifecycleState}</Badge>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTool(a.id)}
                  disabled={loading === a.id}
                  className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  {loading === a.id ? "..." : "Remove"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && availableTools.length > 0 && (
        <div className="pt-4 border-t border-[var(--border)]">
          <h3 className="font-semibold mb-2">Add tool (available)</h3>
          <p className="text-sm text-[var(--text-2)] mb-2">
            Tools shown are IN_SERVICE and not assigned to any trolley.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableTools.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded border border-[var(--border)]"
              >
                <span className="text-sm">{a.assetTag} — {a.assetType.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => assignTool(a.id)}
                  disabled={loading === a.id}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {loading === a.id ? "..." : "Add"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {canEdit && availableTools.length === 0 && assignedTools.length > 0 && (
        <p className="text-sm text-[var(--text-2)]">
          No more available tools. Remove tools from this trolley or others to make them available.
        </p>
      )}
    </div>
  );
}
