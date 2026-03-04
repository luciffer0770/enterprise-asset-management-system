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
import type { Asset, AssetType, OrgUnit, Location, InventoryPool } from "@prisma/client";

export function EditAssetForm({
  asset,
  types,
  orgUnits,
  locations,
  pools,
}: {
  asset: Asset & { assetType: AssetType };
  types: AssetType[];
  orgUnits: OrgUnit[];
  locations: Location[];
  pools: InventoryPool[];
}) {
  const router = useRouter();
  const [condition, setCondition] = useState(asset.condition);
  const [locationId, setLocationId] = useState(asset.locationId ?? "");
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
          locationId: locationId || null,
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
        <Label>Location</Label>
        <Select
          value={locationId || "__none__"}
          onValueChange={(v) => setLocationId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
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
