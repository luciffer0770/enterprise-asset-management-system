"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AssetOption = { id: string; assetTag: string };

const METHODS = ["sale", "scrap", "donate", "transfer"] as const;

export function AddDisposalModal({
  open,
  onOpenChange,
  assets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: AssetOption[];
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [method, setMethod] = useState<typeof METHODS[number]>("scrap");
  const [disposalDate, setDisposalDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [proceeds, setProceeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      setError("Select an asset.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/disposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          method,
          disposalDate: new Date(disposalDate).toISOString(),
          proceeds: proceeds ? parseFloat(proceeds) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create disposal");
      }
      onOpenChange(false);
      setAssetId("");
      setProceeds("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New disposal</DialogTitle>
          <DialogDescription>
            Record disposal of an asset. Each asset can only have one disposal record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset">Asset</Label>
            <select
              id="asset"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
            >
              <option value="">Select asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof METHODS[number])}
              className="mt-1 flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="date">Disposal date</Label>
            <Input
              id="date"
              type="date"
              value={disposalDate}
              onChange={(e) => setDisposalDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="proceeds">Proceeds (optional)</Label>
            <Input
              id="proceeds"
              type="number"
              step="0.01"
              min="0"
              value={proceeds}
              onChange={(e) => setProceeds(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Create disposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
