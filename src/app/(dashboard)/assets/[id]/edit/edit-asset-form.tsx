"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset, AssetType, OrgUnit, Location, InventoryPool, Trolley } from "@prisma/client";

export function EditAssetForm({
  asset,
  types,
  orgUnits,
  locations,
  pools,
  trolleys,
}: {
  asset: Asset & { assetType: AssetType; trolley?: Trolley & { project: { name: string } } | null };
  types: AssetType[];
  orgUnits: OrgUnit[];
  locations: Location[];
  pools: InventoryPool[];
  trolleys: (Trolley & { project: { name: string } })[];
}) {
  const router = useRouter();
  const [condition, setCondition] = useState(asset.condition);
  const [locationPath, setLocationPath] = useState(asset.locationPath ?? "");
  const NONE = "__none__";
  const [trolleyId, setTrolleyId] = useState(asset.trolleyId ?? NONE);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition,
          locationPath: locationPath || null,
          trolleyId: trolleyId === NONE ? null : trolleyId,
        }),
      });
      if (!res.ok) {
        alert("Failed");
        return;
      }
      router.push(`/assets/${asset.id}`);
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Asset Tag</Label>
        <p className="font-medium">{asset.assetTag}</p>
      </div>
      <div>
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger id="condition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GOOD">Good</SelectItem>
            <SelectItem value="FAIR">Fair</SelectItem>
            <SelectItem value="POOR">Poor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Location (type manually)</Label>
        <Input
          value={locationPath}
          onChange={(e) => setLocationPath(e.target.value)}
          placeholder="e.g. Building A, Bay 3, Shelf 2"
        />
      </div>
      <div>
        <Label>Trolley</Label>
        <Select value={trolleyId} onValueChange={setTrolleyId}>
          <SelectTrigger>
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {trolleys.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.trolleyCode} — {t.project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        Save
      </Button>
    </form>
  );
}
