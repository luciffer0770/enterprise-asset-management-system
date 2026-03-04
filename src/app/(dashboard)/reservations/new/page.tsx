import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCapability } from "@/lib/permissions";
import { ReservationForm } from "./reservation-form";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "EXTERNAL";
  if (!hasCapability(role, "reservations")) {
    return (
      <div className="p-8 text-center text-[var(--text-2)]">Forbidden</div>
    );
  }

  const params = await searchParams;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId ?? "";
  const userId = (session?.user as { id?: string })?.id ?? "";

  const asset = params.assetId
    ? await prisma.asset.findFirst({
        where: { id: params.assetId, tenantId },
        include: { assetType: true },
      })
    : null;

  const assets = await prisma.asset.findMany({
    where: { tenantId, lifecycleState: "IN_SERVICE" },
    include: { assetType: true },
    take: 100,
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">New Reservation</h1>
      <ReservationForm
        asset={asset}
        assets={assets}
        userId={userId}
      />
    </div>
  );
}
