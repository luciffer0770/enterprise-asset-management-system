import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { TrolleyTwoPanel } from "./trolley-two-panel";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight } from "lucide-react";

export default async function TrolleysPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  if (!hasCapability(role, "assets:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view trolleys.
      </div>
    );
  }

  const assetWhere =
    role === "ADMIN" ? { tenantId } : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const [pools, projects, availableAssets, totalTools] = await Promise.all([
    prisma.inventoryPool
      ? prisma.inventoryPool.findMany({
          where: { tenantId },
          include: {
            _count: { select: { assets: true } },
            assets: { take: 5, include: { assetType: true } },
          },
          orderBy: { name: "asc" },
        })
      : [],
    prisma.project
      ? prisma.project.findMany({
          where: { tenantId },
          select: { id: true, name: true },
        })
      : [],
    prisma.asset.findMany({
      where: { ...assetWhere, lifecycleState: "IN_SERVICE", status: "IN_SERVICE" },
      include: { assetType: true },
      orderBy: { assetTag: "asc" },
      take: 200,
    }),
    prisma.asset.count({ where: { tenantId, poolId: { not: null } } }),
  ]);

  const activePools = pools.filter((p) => p._count.assets > 0).length;

  const projectByNameId = new Map(projects.map((p) => [p.id, p.name]));
  const poolsWithProject = pools.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    kind: p.kind,
    isActive: p.isActive,
    _count: p._count,
    projectName: p.projectId ? projectByNameId.get(p.projectId) : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-2)]">Total Trolleys</p>
            <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{pools.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-2)]">Active Trolleys</p>
            <p className="text-2xl font-bold text-[var(--status-available)]">{activePools}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-2)]">Tools Assigned</p>
            <p className="text-2xl font-bold text-[var(--brand-dark-blue)]">{totalTools}</p>
          </CardContent>
        </Card>
      </div>

      <TrolleyTwoPanel
        pools={poolsWithProject}
        availableAssets={availableAssets.map((a) => ({
          id: a.id,
          assetTag: a.assetTag,
          assetType: a.assetType,
        }))}
        canWrite={hasCapability(role, "assets:write")}
      />

      <div>
        <h2 className="text-lg font-semibold text-[var(--text-0)] mb-3">All trolleys</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => (
            <Card key={pool.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--text-0)]">{pool.name}</h3>
                    <p className="text-sm text-[var(--text-2)] mt-0.5">
                      {pool.projectId && projectByNameId.get(pool.projectId)
                        ? `Project: ${projectByNameId.get(pool.projectId)}`
                        : "—"}
                    </p>
                    <p className="text-sm text-[var(--text-2)] mt-0.5 flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      {pool._count.assets} Tools
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {pool.code ?? `TR-${pool.id.slice(-4)}`} • {pool.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link href={`/trolleys/${pool.id}`}>
                      View Details
                      <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                  </Button>
                </div>
                {pool.assets.length > 0 && (
                  <ul className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-1">
                    {pool.assets.map((a) => (
                      <li key={a.id} className="text-sm text-[var(--text-2)]">
                        {a.assetTag} — {a.assetType.name}
                      </li>
                    ))}
                    {pool._count.assets > pool.assets.length && (
                      <li className="text-xs text-[var(--text-muted)]">
                        +{pool._count.assets - pool.assets.length} more
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {pools.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-8 text-center text-[var(--text-2)]">
          No trolleys defined. Add one with &quot;+ Add Trolley&quot; or assign tools from the
          Tools page.
        </div>
      )}
    </div>
  );
}
