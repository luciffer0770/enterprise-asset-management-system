"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CalibrationDatesForm({
  calibrationId,
  performedDate,
  nextDueDate,
  canWrite,
}: {
  calibrationId: string;
  performedDate: string | null;
  nextDueDate: string | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [performed, setPerformed] = useState(performedDate?.slice(0, 10) ?? "");
  const [nextDue, setNextDue] = useState(nextDueDate?.slice(0, 10) ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/calibration/${calibrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          performedDate: performed || undefined,
          nextDueDate: nextDue || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setOpen(false);
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!canWrite) return null;

  return (
    <div>
      {open ? (
        <div className="flex flex-col gap-2 py-2">
          <div>
            <Label className="text-xs">Performed</Label>
            <Input
              type="date"
              value={performed}
              onChange={(e) => setPerformed(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Next Due</Label>
            <Input
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={loading}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Set dates
        </Button>
      )}
    </div>
  );
}
