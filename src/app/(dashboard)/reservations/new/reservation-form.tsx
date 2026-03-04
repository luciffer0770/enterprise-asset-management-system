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
import type { Asset, AssetType } from "@prisma/client";

export function ReservationForm({
  asset: initialAsset,
  assets,
  userId,
}: {
  asset: (Asset & { assetType: AssetType }) | null;
  assets: (Asset & { assetType: AssetType })[];
  userId: string;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(initialAsset?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId || !startDate || !endDate) {
      alert("Fill required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          startDate,
          endDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      router.push("/reservations");
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
        <Label htmlFor="asset">Asset</Label>
        <Select value={assetId} onValueChange={setAssetId} required>
          <SelectTrigger id="asset">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.assetTag} — {a.assetType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="start">Start</Label>
        <Input
          id="start"
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="end">End</Label>
        <Input
          id="end"
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        Create Reservation
      </Button>
    </form>
  );
}
