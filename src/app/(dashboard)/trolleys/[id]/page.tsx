import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrolleyDetailPanel } from "./trolley-detail-panel";

export default async function TrolleyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;

  const pool = prisma.inventoryPool
    ? await prisma.inventoryPool.findFirst({
        where: { id, tenantId },
        include: {
          _count: { select: { assets: true } },
          assets: {
            include: {
              assetType: true,
              assignedUser: { select: { displayName: true } },
              ownerOrgUnit: { select: { name: true } },
            },
          },
        },
      })
    : null;

  if (!pool) notFound();

  const projectName =
    pool.projectId && prisma.project
      ? (await prisma.project.findUnique({ where: { id: pool.projectId }, select: { name: true } }))
          ?.name ?? null
      : null;
  const availableAssets = prisma.asset
    ? await prisma.asset.findMany({
        where: {
          tenantId,
          lifecycleState: "IN_SERVICE",
          status: "IN_SERVICE",
          id: { notIn: pool.assets.map((a) => a.id) },
        },
        include: { assetType: true },
        orderBy: { assetTag: "asc" },
        take: 100,
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/trolleys"
            className="text-sm text-[var(--brand-dark-blue)] hover:underline mb-1 inline-block"
          >
            ← Trolleys
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text-0)]">Trolley Details</h1>
        </div>
      </div>

      <TrolleyDetailPanel
        pool={{
          id: pool.id,
          name: pool.name,
          code: pool.code,
          kind: pool.kind,
          isActive: pool.isActive,
          projectName,
          toolCount: pool._count.assets,
          assets: pool.assets.map((a) => ({
            id: a.id,
            assetTag: a.assetTag,
            assetTypeName: a.assetType.name,
            status: a.lifecycleState,
            ownership: a.assignedUser?.displayName ?? a.ownerOrgUnit?.name ?? "Company",
          })),
        }}
        availableAssets={availableAssets.map((a) => ({
          id: a.id,
          assetTag: a.assetTag,
          assetTypeName: a.assetType.name,
        }))}
        canWrite={hasCapability(role, "assets:write")}
      />
    </div>
  );
}
