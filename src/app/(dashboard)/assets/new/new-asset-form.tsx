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
import type { AssetType, OrgUnit, Location, InventoryPool } from "@prisma/client";

export function NewAssetForm({
  types,
  orgUnits,
  locations,
  pools,
}: {
  types: AssetType[];
  orgUnits: OrgUnit[];
  locations: Location[];
  pools: InventoryPool[];
}) {
  const router = useRouter();
  const [assetTag, setAssetTag] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [ownerOrgUnitId, setOwnerOrgUnitId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [poolId, setPoolId] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetTag || !assetTypeId) {
      alert("Tag and type required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTag,
          serialNumber: serialNumber || undefined,
          assetTypeId,
          ownerOrgUnitId: ownerOrgUnitId || undefined,
          locationId: locationId || undefined,
          poolId: poolId || undefined,
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      const data = await res.json();
      router.push(`/assets/${data.id}`);
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
        <Label htmlFor="tag">Asset Tag *</Label>
        <Input
          id="tag"
          value={assetTag}
          onChange={(e) => setAssetTag(e.target.value)}
          required
          placeholder="TAG-00001"
        />
      </div>
      <div>
        <Label htmlFor="serial">Serial Number</Label>
        <Input
          id="serial"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="type">Type *</Label>
        <Select value={assetTypeId} onValueChange={setAssetTypeId} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Org Unit</Label>
        <Select
          value={ownerOrgUnitId || "__none__"}
          onValueChange={(v) => setOwnerOrgUnitId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {orgUnits.map((ou) => (
              <SelectItem key={ou.id} value={ou.id}>
                {ou.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Location (where tool is stored)</Label>
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
      <div>
        <Label>Pool (optional – for trolley assignment only)</Label>
        <Select
          value={poolId || "__none__"}
          onValueChange={(v) => setPoolId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="— No pool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {pools.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="cost">Purchase Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          value={purchaseCost}
          onChange={(e) => setPurchaseCost(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        Create Asset
      </Button>
    </form>
  );
}
