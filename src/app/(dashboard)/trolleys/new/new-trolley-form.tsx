"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewTrolleyForm({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          projectId: projectId || undefined,
          kind: kind.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed");
        return;
      }
      router.push("/trolleys");
      router.refresh();
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Trolley name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Engine Trolley T-01"
          required
        />
      </div>
      <div>
        <Label htmlFor="code">Code (e.g. TR-001)</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="TR-001"
        />
      </div>
      <div>
        <Label htmlFor="project">Project</Label>
        <select
          id="project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
        >
          <option value="">—</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="kind">Department</Label>
        <select
          id="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-sm"
        >
          <option value="">—</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Electrical">Electrical</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          Create Trolley
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/trolleys">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
