"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckoutAssetSearch } from "./checkout-asset-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Asset, AssetType, Location } from "@prisma/client";

type AssetWithRelations = Asset & {
  assetType: AssetType;
  location?: Location | null;
};

type PoolOption = { id: string; name: string; code: string | null };

export function CheckoutForm({
  asset: initialAsset,
  availableAssets = [],
  pools = [],
  userId,
  tenantId,
  role,
}: {
  asset: (Asset & { assetType: AssetType }) | null;
  availableAssets?: AssetWithRelations[];
  pools?: PoolOption[];
  userId: string;
  tenantId: string;
  role: string;
}) {
  const router = useRouter();
  const [asset, setAsset] = useState(initialAsset);
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [requestedByEmployeeId, setRequestedByEmployeeId] = useState("");
  const [poolId, setPoolId] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableFilter, setAvailableFilter] = useState("");
  const isExternal = role === "EXTERNAL";
  const isMechOrElec = role === "MECHANICAL" || role === "ELECTRICAL";
  const filteredAvailable = useMemo(() => {
    if (!availableFilter.trim()) return availableAssets;
    const q = availableFilter.toLowerCase();
    return availableAssets.filter(
      (a) =>
        a.assetTag.toLowerCase().includes(q) ||
        a.assetType.name.toLowerCase().includes(q) ||
        (a.serialNumber?.toLowerCase().includes(q) ?? false)
    );
  }, [availableAssets, availableFilter]);

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
          reason: reason.trim() || undefined,
          requestedByName: requestedByName.trim() || undefined,
          requestedByEmployeeId: requestedByEmployeeId.trim() || undefined,
          poolId: poolId || undefined,
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
  const returnPending = asset?.lifecycleState === "RETURN_PENDING";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-4">Search by tag or barcode</h2>
            <CheckoutAssetSearch
              initialAsset={asset}
              onSelect={setAsset}
              tenantId={tenantId}
              role={role}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-3">Available tools</h2>
            <p className="text-sm text-[var(--text-2)] mb-3">
              Tools you can check out. Click one to select.
            </p>
            <Input
              placeholder="Filter by tag, type, or serial..."
              value={availableFilter}
              onChange={(e) => setAvailableFilter(e.target.value)}
              className="mb-3"
            />
            <ul className="border border-[var(--border)] rounded-lg divide-y max-h-64 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <li className="px-3 py-4 text-sm text-[var(--text-2)] text-center">
                  {availableAssets.length === 0
                    ? "No tools available for checkout."
                    : "No matches for your filter."}
                </li>
              ) : (
                filteredAvailable.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-[var(--surface-2)] flex flex-col gap-0.5",
                        asset?.id === a.id && "bg-[var(--surface-2)] ring-1 ring-[var(--brand-dark-blue)]"
                      )}
                      onClick={() => setAsset(a)}
                    >
                      <span className="font-medium">{a.assetTag}</span>
                      <span className="text-sm text-[var(--text-2)]">
                        {a.assetType.name}
                        {a.location?.name ? ` · ${a.location.name}` : ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {asset && (
        <Card>
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-4">{asset.assetTag}</h2>
            <p className="text-sm text-[var(--text-2)] mb-4">
              {asset.assetType.name} — {asset.lifecycleState}
            </p>

            {returnPending ? (
              <p className="text-sm text-[var(--status-maintenance)] font-medium">
                Return submitted — pending approval. An approver will review and close the ticket.
              </p>
            ) : hasCheckout ? (
              <form onSubmit={handleReturn}>
                <Button type="submit" disabled={loading} variant="primary">
                  Submit Return (creates ticket)
                </Button>
              </form>
            ) : asset.lifecycleState === "IN_SERVICE" ? (
              <form onSubmit={handleCheckout} className="space-y-4">
                {isExternal && (
                  <>
                    <div>
                      <Label htmlFor="reqName">Your name *</Label>
                      <Input
                        id="reqName"
                        value={requestedByName}
                        onChange={(e) => setRequestedByName(e.target.value)}
                        placeholder="Full name"
                        required={isExternal}
                      />
                    </div>
                    <div>
                      <Label htmlFor="empId">Employee ID *</Label>
                      <Input
                        id="empId"
                        value={requestedByEmployeeId}
                        onChange={(e) => setRequestedByEmployeeId(e.target.value)}
                        placeholder="Employee ID"
                        required={isExternal}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason for request *</Label>
                      <Input
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why you need this tool"
                        required={isExternal}
                      />
                    </div>
                  </>
                )}
                {isMechOrElec && (
                  <>
                    <div>
                      <Label htmlFor="pool">Assign to trolley (optional)</Label>
                      <select
                        id="pool"
                        value={poolId}
                        onChange={(e) => setPoolId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
                      >
                        <option value="">No trolley</option>
                        {pools.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code ?? p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="reasonM">Reason (optional)</Label>
                      <Input
                        id="reasonM"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason if not assigning to trolley"
                      />
                    </div>
                  </>
                )}
                {!isExternal && !isMechOrElec && (
                  <div>
                    <Label htmlFor="reasonA">Reason (optional)</Label>
                    <Input
                      id="reasonA"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for checkout"
                    />
                  </div>
                )}
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
