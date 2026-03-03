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

export function NewTrolleyForm() {
  const router = useRouter();
  const [trolleyCode, setTrolleyCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [department, setDepartment] = useState("Mechanical");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trolleyCode.trim()) {
      alert("Trolley code required");
      return;
    }
    if (!projectName.trim()) {
      alert("Project name required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trolleys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trolleyCode: trolleyCode.trim(),
          projectName: projectName.trim(),
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
          placeholder="e.g. ENG-TR-101"
          required
          className="mt-1"
        />
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
      <Button type="submit" disabled={loading}>
        Add Trolley
      </Button>
    </form>
  );
}
