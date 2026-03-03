"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset, AssetType } from "@prisma/client";
import type { Trolley } from "@prisma/client";

export function IssueToolSection({
  availableAssets,
  trolleys,
  role,
  onIssue,
}: {
  availableAssets: (Asset & { assetType: AssetType })[];
  trolleys: (Trolley & { project: { name: string } })[];
  role: string;
  onIssue?: () => void;
}) {
  const router = useRouter();
  const NONE = "__none__";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<(Asset & { assetType: AssetType }) | null>(null);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmpId, setBorrowerEmpId] = useState("");
  const [reason, setReason] = useState("");
  const [trolleyId, setTrolleyId] = useState(NONE);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const isMechOrElec = role === "MECHANICAL" || role === "ELECTRICAL";

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
    if (!borrowerName.trim() || !borrowerEmpId.trim() || !reason.trim()) {
      alert("Name, Employee ID, and Reason are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/issue-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selected.id,
          borrowerName: borrowerName.trim(),
          borrowerEmpId: borrowerEmpId.trim(),
          reason: reason.trim(),
          trolleyId: trolleyId === NONE ? undefined : trolleyId,
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
      setBorrowerName("");
      setBorrowerEmpId("");
      setReason("");
      setTrolleyId(NONE);
      setDueDate("");
      onIssue?.();
      router.refresh();
    } catch {
      alert("Request failed");
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Full name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="empid">Employee ID *</Label>
              <Input
                id="empid"
                value={borrowerEmpId}
                onChange={(e) => setBorrowerEmpId(e.target.value)}
                placeholder="Emp ID"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isMechOrElec ? "Reason (if no trolley, mention here)" : "Reason for issue"}
                className="mt-1"
                required
              />
            </div>
            {isMechOrElec && (
              <div>
                <Label>Trolley (if applicable)</Label>
                <Select value={trolleyId} onValueChange={setTrolleyId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="None / mention in reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not applicable</SelectItem>
                    {trolleys.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.trolleyCode} — {t.project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              {loading ? "Submitting..." : "Request Tool (await admin approval)"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
