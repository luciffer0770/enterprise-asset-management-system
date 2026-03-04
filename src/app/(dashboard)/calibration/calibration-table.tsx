"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CalibrationEvent, Asset, AssetType } from "@prisma/client";
import { UploadCertModal } from "./upload-cert-modal";

type CalWithAsset = CalibrationEvent & {
  asset: Asset & { assetType: AssetType };
};

export function CalibrationTable({
  items,
  canWrite,
}: {
  items: CalWithAsset[];
  canWrite: boolean;
}) {
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCal, setSelectedCal] = useState<CalWithAsset | null>(null);

  const openUploadCert = (c: CalWithAsset) => {
    setSelectedCal(c);
    setCertModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="industrial-table w-full">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Last Result</th>
              <th>Next Due</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link
                    href={`/assets/${c.assetId}`}
                    className="font-medium text-[var(--brand-dark-blue)] hover:underline"
                  >
                    {c.asset.assetTag}
                  </Link>
                  <p className="text-xs text-[var(--text-2)]">{c.asset.assetType.name}</p>
                </td>
                <td>
                  <Badge
                    variant={
                      c.result === "PASS"
                        ? "success"
                        : c.result === "OOT"
                          ? "error"
                          : "warning"
                    }
                  >
                    {c.result}
                  </Badge>
                </td>
                <td className="text-sm">
                  {c.nextDueDate ? format(new Date(c.nextDueDate), "PP") : "—"}
                </td>
                {canWrite && (
                  <td>
                    <button
                      type="button"
                      onClick={() => openUploadCert(c)}
                      className="text-sm text-[var(--brand-dark-blue)] hover:underline"
                    >
                      {c.certificateUrl ? "Edit cert" : "Upload cert"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-8 text-center text-[var(--text-2)]">None</div>
        )}
      </div>
      <UploadCertModal
        open={certModalOpen}
        onOpenChange={setCertModalOpen}
        calibration={selectedCal}
      />
    </>
  );
}
