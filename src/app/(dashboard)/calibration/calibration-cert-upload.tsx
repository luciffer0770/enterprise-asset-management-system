"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function CalibrationCertUpload({ calibrationId, assetTag, hasCert }: { calibrationId: string; assetTag: string; hasCert: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/calibration/${calibrationId}/cert`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Upload failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Upload failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.PDF"
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="h-3 w-3 mr-1" />
        {loading ? "..." : hasCert ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}
