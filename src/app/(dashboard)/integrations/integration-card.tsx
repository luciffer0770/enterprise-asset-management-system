"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { IntegrationConfig } from "@prisma/client";

export function IntegrationCard({ config }: { config: IntegrationConfig }) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) {
        setEnabled(!enabled);
      }
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setLoading(true);
    setStatus(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("OK — Connection stub (not implemented)");
    } catch {
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  }

  const labels: Record<string, string> = {
    OIDC_SSO: "OIDC / SSO",
    SCIM: "SCIM Provisioning",
    ERP: "ERP",
    CMMS: "CMMS",
    BARCODE_RFID: "Barcode / RFID",
    IOT: "IoT Telemetry",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-semibold">{labels[config.type] ?? config.type}</h3>
        <Badge variant={enabled ? "success" : "neutral"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-2)]">
          {config.type === "OIDC_SSO" &&
            "Configure ISSUER, CLIENT_ID, CLIENT_SECRET in env."}
          {config.type === "SCIM" &&
            "SCIM /api/scim/v2/Users and /Groups endpoints (Admin token auth)."}
          {config.type === "ERP" && "Sync purchase orders, vendors, asset capitalization."}
          {config.type === "CMMS" && "Push work orders, pull status."}
          {config.type === "BARCODE_RFID" && "Barcode formats, RFID health, tag encoding."}
          {config.type === "IOT" && "Ingest telemetry, compute condition alerts."}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={toggle} disabled={loading}>
            {enabled ? "Disable" : "Enable"}
          </Button>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={loading}>
            Test Connection
          </Button>
        </div>
        {status && (
          <p className="text-sm text-[var(--text-2)]">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
