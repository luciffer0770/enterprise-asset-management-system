"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function AssetSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/assets?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-2)]" />
      <input
        name="q"
        type="search"
        placeholder="Search tag or serial..."
        defaultValue={searchParams.get("q") ?? ""}
        className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] text-sm"
      />
    </form>
  );
}
