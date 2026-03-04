import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddDisposalButton } from "./add-disposal-button";

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "finance:read")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view finance data.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];

  const assetWhere =
    role === "ADMIN"
      ? { tenantId }
      : { tenantId, ownerOrgUnitId: { in: orgUnitIds } };

  const [depreciation, disposals] = await Promise.all([
    prisma.depreciationBook.findMany({
      where: { asset: assetWhere },
      include: { asset: { include: { assetType: true } } },
      take: 50,
    }),
    prisma.disposalRecord.findMany({
      where: { asset: { tenantId } },
      include: { asset: { include: { assetType: true } } },
      take: 20,
    }),
  ]);

  const totalNBV = depreciation.reduce((s, d) => s + (d.nbv ?? 0), 0);
  const disposedAssetIds = new Set(disposals.map((d) => d.assetId));
  const assetsForDisposal =
    hasCapability(role, "finance:write") ?
      depreciation
        .filter((d) => !disposedAssetIds.has(d.assetId))
        .map((d) => ({ id: d.asset.id, assetTag: d.asset.assetTag }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Depreciation & Disposal</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--text-2)]">
              Total NBV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              ${totalNBV.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Depreciation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="industrial-table w-full">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Method</th>
                  <th>Useful Life</th>
                  <th>NBV</th>
                </tr>
              </thead>
              <tbody>
                {depreciation.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link
                        href={`/assets/${d.assetId}`}
                        className="font-medium text-[var(--brand-dark-blue)] hover:underline"
                      >
                        {d.asset.assetTag}
                      </Link>
                    </td>
                    <td>{d.method}</td>
                    <td>{d.usefulLife} yrs</td>
                    <td>${(d.nbv ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Disposals</CardTitle>
          <AddDisposalButton assets={assetsForDisposal} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="industrial-table w-full">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Proceeds</th>
                </tr>
              </thead>
              <tbody>
                {disposals.map((d) => (
                  <tr key={d.id}>
                    <td>{d.asset.assetTag}</td>
                    <td>{d.method}</td>
                    <td>{new Date(d.disposalDate).toLocaleDateString()}</td>
                    <td>${(d.proceeds ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {disposals.length === 0 && (
            <p className="p-4 text-center text-[var(--text-2)]">No disposal records</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
