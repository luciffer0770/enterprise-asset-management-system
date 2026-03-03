import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Fuel } from "lucide-react";
import { notFound } from "next/navigation";
import { TrolleyToolAssign } from "./trolley-tool-assign";

export default async function TrolleyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";

  if (!hasCapability(role, "trolleys")) {
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

  const availableAssets = await prisma.asset.findMany({
    where: {
      tenantId,
      lifecycleState: "IN_SERVICE",
      trolleyId: null,
    },
    include: { assetType: true },
    orderBy: { assetTag: "asc" },
    take: 100,
  });

  const canEdit = hasCapability(role, "trolleys");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/trolleys">← Back</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Fuel className="h-8 w-8 text-[var(--brand-dark-blue)]" />
          <h1 className="text-2xl font-semibold">{trolley.trolleyCode}</h1>
          <Badge variant={trolley.status === "ACTIVE" ? "success" : "neutral"}>
            {trolley.status}
          </Badge>
        </div>
        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/trolleys/${trolley.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Trolley
            </Link>
          </Button>
        )}
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
            <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{trolley.assets.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Assignment</CardTitle>
          <p className="text-sm text-[var(--text-2)]">
            Tools on a trolley are not available in the general pool. When a tool is returned from checkout, it goes back to the trolley.
          </p>
        </CardHeader>
        <CardContent>
          <TrolleyToolAssign
            trolleyId={trolley.id}
            assignedTools={trolley.assets.map((a) => ({
              id: a.id,
              assetTag: a.assetTag,
              assetType: a.assetType,
              lifecycleState: a.lifecycleState,
              trolleyId: a.trolleyId,
            }))}
            availableTools={availableAssets.map((a) => ({
              id: a.id,
              assetTag: a.assetTag,
              assetType: a.assetType,
              lifecycleState: a.lifecycleState,
              trolleyId: a.trolleyId,
            }))}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
