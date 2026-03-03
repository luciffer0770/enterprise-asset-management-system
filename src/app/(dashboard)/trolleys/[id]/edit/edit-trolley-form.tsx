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

export function EditTrolleyForm({
  trolley,
}: {
  trolley: { id: string; trolleyCode: string; projectId: string; project: { name: string }; department: string; status: string };
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(trolley.project?.name ?? "");
  const [department, setDepartment] = useState(trolley.department);
  const [status, setStatus] = useState(trolley.status);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Project name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/trolleys/${trolley.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: projectName.trim(), department, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Failed");
        return;
      }
      router.push(`/trolleys/${trolley.id}`);
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
        <Label>Trolley Code</Label>
        <p className="font-medium mt-1">{trolley.trolleyCode}</p>
      </div>
      <div>
        <Label htmlFor="project">Project Name *</Label>
        <Input
          id="project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. GE90-112 Overhaul"
          required
          className="mt-1"
        />
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
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        Save
      </Button>
    </form>
  );
}
