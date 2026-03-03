"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Star, Wrench } from "lucide-react";

export function AssetBulkActions({ canCheckout }: { canCheckout: boolean }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canCheckout && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/tickets")}
        >
          <ClipboardCheck className="h-4 w-4 mr-1" />
          Checkout
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => router.push("/reservations/new")}>
        <Star className="h-4 w-4 mr-1" />
        Reserve
      </Button>
      <Button variant="outline" size="sm" onClick={() => router.push("/work-orders")}>
        <Wrench className="h-4 w-4 mr-1" />
        Service
      </Button>
    </div>
  );
}
