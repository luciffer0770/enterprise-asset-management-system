"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Asset, AssetType } from "@prisma/client";

export function CheckoutAssetSearch({
  initialAsset,
  onSelect,
  tenantId,
  role,
}: {
  initialAsset: (Asset & { assetType: AssetType }) | null;
  onSelect: (a: (Asset & { assetType: AssetType }) | null) => void;
  tenantId: string;
  role: string;
}) {
  const [query, setQuery] = useState(initialAsset?.assetTag ?? "");
  const [results, setResults] = useState<(Asset & { assetType: AssetType })[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/assets/search?q=${encodeURIComponent(query)}&tenantId=${tenantId}`
      );
      const data = await res.json();
      setResults(data.assets ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter asset tag or scan barcode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <Button type="button" onClick={search} disabled={loading}>
          Search
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="border border-[var(--border)] rounded-lg divide-y max-h-48 overflow-y-auto">
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-[var(--surface-2)] flex justify-between"
                onClick={() => {
                  onSelect(a);
                  setQuery(a.assetTag);
                  setResults([]);
                }}
              >
                <span className="font-medium">{a.assetTag}</span>
                <span className="text-sm text-[var(--text-2)]">{a.assetType.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
