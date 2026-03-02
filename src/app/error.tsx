"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-1)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-0)]">Something went wrong</h1>
      <p className="mt-2 text-sm text-[var(--text-2)]">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
