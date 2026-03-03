import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TrolleysPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "trolleys")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        You do not have permission to view trolleys.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const orgUnitIds = (session?.user as { orgUnitIds?: string[] })?.orgUnitIds ?? [];
  const userId = (session?.user as { id?: string })?.id ?? "";

  const trolleyWhere =
    role === "ADMIN" || role === "LAB_INCHARGE"
      ? { tenantId }
      : role === "MECHANICAL"
          ? { tenantId, department: "Mechanical" }
          : role === "ELECTRICAL"
            ? { tenantId, department: "Electrical" }
            : { tenantId };

  const trolleys = await prisma.trolley.findMany({
    where: trolleyWhere,
    include: {
      project: true,
      assets: { include: { assetType: true } },
    },
    orderBy: { trolleyCode: "asc" },
  });

  const kpis = [
    { label: "Total Trolleys", value: trolleys.length, color: "text-[var(--brand-dark-blue)]" },
    { label: "Active", value: trolleys.filter((t) => t.status === "ACTIVE").length, color: "text-[var(--success)]" },
    { label: "Inactive", value: trolleys.filter((t) => t.status === "INACTIVE").length, color: "text-[var(--text-2)]" },
    { label: "Total Tools", value: trolleys.reduce((s, t) => s + t.assets.length, 0), color: "text-[var(--brand-light-blue)]" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Trolley Management</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-[var(--border)]">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--text-2)]">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {trolleys.map((t) => (
          <Card key={t.id} className="border-[var(--border)] overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">{t.trolleyCode}</span>
                <Badge variant={t.status === "ACTIVE" ? "success" : "neutral"}>
                  {t.status}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-2)]">Project: {t.project.name}</p>
              <p className="text-sm text-[var(--text-2)]">Department: {t.department}</p>
              <p className="text-sm font-medium mt-2">Tools: {t.assets.length}</p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href={`/trolleys/${t.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
