import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability, canAccessAsset } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function TrolleyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  if (!hasCapability(role, "assets:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view this trolley.
      </div>
    );
  }

  const trolley = await prisma.trolley.findFirst({
    where: { id, tenantId },
    include: {
      project: true,
      assets: {
        include: {
          assetType: true,
          ownerOrgUnit: true,
          location: true,
        },
      },
    },
  });

  if (!trolley) notFound();

  const visibleAssets = trolley.assets.filter((a) =>
    canAccessAsset(role, orgUnitIds, a.assignedUserId, a.ownerOrgUnitId, userId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/trolleys">← Back</Link>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">{trolley.trolleyCode}</h1>
        <Badge variant={trolley.status === "ACTIVE" ? "success" : "neutral"}>
          {trolley.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-2)]">Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{trolley.project.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-2)]">Department</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{trolley.department}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-2)]">Tools Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{visibleAssets.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tools on this trolley</CardTitle>
        </CardHeader>
        <CardContent>
          {visibleAssets.length === 0 ? (
            <p className="text-[var(--text-2)]">No tools assigned.</p>
          ) : (
            <div className="space-y-2">
              {visibleAssets.map((a) => (
                <Link
                  key={a.id}
                  href={`/assets/${a.id}`}
                  className="block p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-1)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.assetTag}</span>
                    <Badge variant="neutral">{a.assetType.name}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-2)]">{a.serialNumber ?? "—"}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Status: {a.lifecycleState} • {a.locationPath ?? a.location?.name ?? "—"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
