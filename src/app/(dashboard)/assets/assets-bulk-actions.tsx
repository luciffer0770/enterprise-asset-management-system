"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type ImportRow = {
  assetTag: string;
  serialNumber?: string;
  typeName: string;
  orgUnitName?: string;
  locationName?: string;
  poolName?: string;
  purchaseCost?: number;
};

export function AssetsBulkActions() {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    try {
      setBusy(true);
      const res = await fetch("/api/assets/export");
      if (!res.ok) {
        alert("Failed to export assets");
        return;
      }
      const text = await res.text();
      downloadFile("assets-export.csv", text);
    } catch {
      alert("Failed to export assets");
    } finally {
      setBusy(false);
    }
  }

  function parseCsv(text: string): ImportRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const idx = (name: string) => headers.indexOf(name);
    const rows: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (!cols.length) continue;
      const assetTag = cols[idx("assetTag")] ?? "";
      const typeName = cols[idx("typeName")] ?? "";
      if (!assetTag || !typeName) continue;
      const purchaseCostRaw = cols[idx("purchaseCost")];
      rows.push({
        assetTag,
        serialNumber: cols[idx("serialNumber")] || undefined,
        typeName,
        orgUnitName: cols[idx("orgUnitName")] || undefined,
        locationName: cols[idx("locationName")] || undefined,
        poolName: cols[idx("poolName")] || undefined,
        purchaseCost:
          purchaseCostRaw && !Number.isNaN(Number(purchaseCostRaw))
            ? Number(purchaseCostRaw)
            : undefined,
      });
    }
    return rows;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        alert("No valid rows found in file");
        return;
      }
      const res = await fetch("/api/assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Import failed");
        return;
      }
      alert("Assets imported successfully");
      window.location.reload();
    } catch {
      alert("Import failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <Button variant="outline" size="sm" disabled={busy} onClick={handleExport}>
        Export to Excel/CSV
      </Button>
      <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="underline">Import from Excel/CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        <span>(columns: assetTag, typeName, serialNumber, orgUnitName, locationName, poolName, purchaseCost)</span>
      </div>
    </div>
  );
}

