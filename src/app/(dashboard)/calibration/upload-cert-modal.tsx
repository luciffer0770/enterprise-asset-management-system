"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CalibrationRow = {
  id: string;
  assetTag?: string;
  asset?: { assetTag: string; assetType?: { name: string } };
};

export function UploadCertModal({
  open,
  onOpenChange,
  calibration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calibration: CalibrationRow | null;
}) {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calibration?.id || !certificateId.trim()) {
      setError("Enter a certificate ID or URL.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/calibration/${calibration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateUrl: certificateId.trim().startsWith("http")
            ? certificateId.trim()
            : `CERT-${certificateId.trim()}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      onOpenChange(false);
      setCertificateId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload certificate</DialogTitle>
          <DialogDescription>
            {calibration?.asset?.assetTag ?? calibration?.assetTag ?? "Asset"} — enter certificate
            ID (e.g. CERT-2024-042) or full URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cert">Certificate ID or URL</Label>
            <Input
              id="cert"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="CERT-2024-042"
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
