"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

export function TicketActions() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/checkout">
        <ClipboardCheck className="h-4 w-4 mr-2" />
        Issue / Return Tool
      </Link>
    </Button>
  );
}
