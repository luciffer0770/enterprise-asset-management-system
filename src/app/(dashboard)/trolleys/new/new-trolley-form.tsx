"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewTrolleyForm({
  projects,
  tenantId,
  role,
}: {
  projects: { id: string; name: string }[];
  tenantId: string;
  role: string;
}) {
  const router = useRouter();
  const NONE = "__none__";
  const [trolleyCode, setTrolleyCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState(NONE);
  const [department, setDepartment] = useState("Mechanical");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trolleyCode.trim()) {
      alert("Trolley code required");
      return;
    }
    const projId = projectId === NONE ? null : projectId;
    const projName = projectName.trim();
    if (!projId && !projName) {
      alert("Select a project or enter a new project name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trolleys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trolleyCode: trolleyCode.trim(),
          projectId: projId ?? undefined,
          projectName: projName || undefined,
          department,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      const data = await res.json();
      router.push(`/trolleys/${data.id}`);
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
        <Label htmlFor="code">Trolley Code *</Label>
        <Input
          id="code"
          value={trolleyCode}
          onChange={(e) => setTrolleyCode(e.target.value)}
          placeholder="TR-009"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label>Project</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select or add new below" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>New project (enter name below)</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projectId === NONE && (
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="New project name"
            className="mt-2"
          />
        )}
      </div>
      <div>
        <Label>Department</Label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Mechanical">Mechanical</SelectItem>
            <SelectItem value="Electrical">Electrical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        Add Trolley
      </Button>
    </form>
  );
}
