import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { IntegrationCard } from "./integration-card";

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";

  if (!hasCapability(role, "integrations")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">
        Only admins can configure integrations.
      </div>
    );
  }

  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const configs = await prisma.integrationConfig.findMany({
    where: { tenantId },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Integrations</h1>
      <p className="text-sm text-[var(--text-2)]">
        Configure OIDC SSO, SCIM, ERP, CMMS, Barcode/RFID, and IoT connectors.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((cfg) => (
          <IntegrationCard key={cfg.id} config={cfg} />
        ))}
      </div>
    </div>
  );
}
