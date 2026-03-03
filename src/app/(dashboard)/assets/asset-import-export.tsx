"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export function AssetImportExport({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  function handleExport() {
    window.open("/api/assets/export", "_blank");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message ?? "Import failed");
        return;
      }
      alert(`Imported ${data.created} tools.${data.errors?.length ? ` ${data.errors.length} errors.` : ""}`);
      router.refresh();
    } catch {
      alert("Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
      {canWrite && (
        <>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            id="import-file"
            onChange={handleImport}
            disabled={importing}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("import-file")?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-1" />
            {importing ? "Importing…" : "Import"}
          </Button>
        </>
      )}
    </div>
  );
}
