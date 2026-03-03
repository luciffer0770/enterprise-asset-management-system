"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export function WorkOrderStatus({ workOrderId, currentStatus, canChange }: { workOrderId: string; currentStatus: string; canChange: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (status === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!canChange) return null;

  return (
    <div>
      <Label>Change status</Label>
      <div className="flex gap-2 mt-1">
        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleChange} disabled={loading || status === currentStatus}>
          {loading ? "..." : "Update"}
        </Button>
      </div>
    </div>
  );
}
