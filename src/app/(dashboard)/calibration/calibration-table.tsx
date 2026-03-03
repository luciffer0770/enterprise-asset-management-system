"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download } from "lucide-react";
import type { CalibrationEvent, Asset, AssetType } from "@prisma/client";
import { CalibrationCertUpload } from "./calibration-cert-upload";
import { CalibrationDatesForm } from "./calibration-dates-form";

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
  return (
    <div className="overflow-x-auto">
      <table className="industrial-table w-full">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Last Result</th>
            <th>Performed</th>
            <th>Next Due</th>
            <th>Certificate</th>
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
                {c.performedDate ? format(new Date(c.performedDate), "PP") : "—"}
              </td>
              <td className="text-sm">
                {c.nextDueDate ? format(new Date(c.nextDueDate), "PP") : "—"}
              </td>
              <td>
                {c.certificateUrl ? (
                  <a
                    href={`/api/calibration/${c.id}/cert`}
                    download
                    className="text-sm text-[var(--brand-dark-blue)] hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                ) : (
                  "—"
                )}
              </td>
              {canWrite && (
                <td>
                  <div className="flex flex-col gap-1">
                    <CalibrationDatesForm
                      calibrationId={c.id}
                      performedDate={c.performedDate?.toISOString?.() ?? null}
                      nextDueDate={c.nextDueDate?.toISOString?.() ?? null}
                      canWrite={canWrite}
                    />
                    <CalibrationCertUpload calibrationId={c.id} assetTag={c.asset.assetTag} hasCert={!!c.certificateUrl} />
                  </div>
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
  );
}
