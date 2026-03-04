"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddDisposalModal } from "./add-disposal-modal";

type AssetOption = { id: string; assetTag: string };

export function AddDisposalButton({ assets }: { assets: AssetOption[] }) {
  const [open, setOpen] = useState(false);

  if (assets.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="default"
        className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90"
        onClick={() => setOpen(true)}
      >
        + Disposal
      </Button>
      <AddDisposalModal open={open} onOpenChange={setOpen} assets={assets} />
    </>
  );
}
