"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Asset, AssetType } from "@prisma/client";

export function IssueToolSection({
  availableAssets,
  tenantId,
  onIssue,
}: {
  availableAssets: (Asset & { assetType: AssetType })[];
  tenantId: string;
  onIssue?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<(Asset & { assetType: AssetType }) | null>(null);
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = query.trim()
    ? availableAssets.filter(
        (a) =>
          a.assetTag.toLowerCase().includes(query.toLowerCase()) ||
          (a.serialNumber?.toLowerCase().includes(query.toLowerCase()))
      )
    : availableAssets.slice(0, 20);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selected.id,
          borrowerEmail: borrowerEmail || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Issue failed");
        return;
      }
      setSelected(null);
      setQuery("");
      setBorrowerEmail("");
      setDueDate("");
      onIssue?.();
      router.refresh();
    } catch {
      alert("Issue failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Tool</CardTitle>
        <p className="text-sm text-[var(--text-2)]">
          Type to search or select from the table below
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Search by tag or serial</Label>
          <Input
            placeholder="Type tool tag or serial..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-1)] sticky top-0">
              <tr>
                <th className="text-left p-2">Tag</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={`border-t border-[var(--border)] hover:bg-[var(--surface-1)] ${
                    selected?.id === a.id ? "bg-[var(--brand-light-blue)]/10" : ""
                  }`}
                >
                  <td className="p-2 font-medium">{a.assetTag}</td>
                  <td className="p-2">{a.assetType.name}</td>
                  <td className="p-2">{a.lifecycleState}</td>
                  <td className="p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selected?.id === a.id ? "primary" : "outline"}
                      onClick={() => setSelected(selected?.id === a.id ? null : a)}
                    >
                      {selected?.id === a.id ? "Selected" : "Select"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-4 text-center text-[var(--text-2)]">No tools match</div>
          )}
        </div>
        {selected && selected.lifecycleState === "IN_SERVICE" && (
          <form onSubmit={handleIssue} className="space-y-3 pt-2 border-t">
            <p className="font-medium">
              Issuing: {selected.assetTag} ({selected.assetType.name})
            </p>
            <div>
              <Label htmlFor="borrower">Borrower email (optional)</Label>
              <Input
                id="borrower"
                type="email"
                value={borrowerEmail}
                onChange={(e) => setBorrowerEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="due">Due date (optional)</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Issuing..." : "Issue Tool"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
