"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutAssetSearch } from "./checkout-asset-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Asset, AssetType } from "@prisma/client";

export function CheckoutForm({
  asset: initialAsset,
  userId,
  tenantId,
  role,
}: {
  asset: (Asset & { assetType: AssetType }) | null;
  userId: string;
  tenantId: string;
  role: string;
}) {
  const router = useRouter();
  const [asset, setAsset] = useState(initialAsset);
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          borrowerEmail: borrowerEmail || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Checkout failed");
        return;
      }
      router.refresh();
      router.push("/checkout?filter=overdue");
    } catch {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id }),
      });
      if (!res.ok) {
        alert("Return failed");
        return;
      }
      router.refresh();
      setAsset(null);
    } catch {
      alert("Return failed");
    } finally {
      setLoading(false);
    }
  }

  const hasCheckout = asset?.lifecycleState === "CHECKED_OUT";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="pt-4">
          <h2 className="font-semibold mb-4">Scan or search asset</h2>
          <CheckoutAssetSearch
            initialAsset={asset}
            onSelect={setAsset}
            tenantId={tenantId}
            role={role}
          />
        </CardContent>
      </Card>

      {asset && (
        <Card>
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-4">{asset.assetTag}</h2>
            <p className="text-sm text-[var(--text-2)] mb-4">
              {asset.assetType.name} — {asset.lifecycleState}
            </p>

            {hasCheckout ? (
              <form onSubmit={handleReturn}>
                <Button type="submit" disabled={loading} variant="primary">
                  Mark as Returned
                </Button>
              </form>
            ) : asset.lifecycleState === "IN_SERVICE" ? (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <Label htmlFor="borrower">Borrower email (optional)</Label>
                  <Input
                    id="borrower"
                    type="email"
                    value={borrowerEmail}
                    onChange={(e) => setBorrowerEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="due">Due date (optional)</Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  Check Out
                </Button>
              </form>
            ) : (
              <p className="text-sm text-[var(--text-2)]">
                Asset is not available for checkout (status: {asset.lifecycleState})
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
