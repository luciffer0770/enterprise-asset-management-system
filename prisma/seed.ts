import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TENANT_NAME = process.env.TENANT_NAME ?? "Tooling Dept";
const ASSET_VOLUME_TIER = process.env.ASSET_VOLUME_TIER ?? "small";

const ASSET_COUNTS = { small: 250, medium: 10000, large: 100000 };

async function main() {
  const count = ASSET_COUNTS[ASSET_VOLUME_TIER as keyof typeof ASSET_COUNTS] ?? 250;
  const assetLimit = Math.min(count, 250);

  // Tenant
  let tenant = await prisma.tenant.findFirst({ where: { name: TENANT_NAME } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: TENANT_NAME } });
  }

  // Org units
  let mechanical = await prisma.orgUnit.findFirst({
    where: { tenantId: tenant.id, kind: "mechanical" },
  });
  if (!mechanical) {
    mechanical = await prisma.orgUnit.create({
      data: { tenantId: tenant.id, name: "Mechanical", kind: "mechanical" },
    });
  }
  let electrical = await prisma.orgUnit.findFirst({
    where: { tenantId: tenant.id, kind: "electrical" },
  });
  if (!electrical) {
    electrical = await prisma.orgUnit.create({
      data: { tenantId: tenant.id, name: "Electrical", kind: "electrical" },
    });
  }

  // Locations
  let loc1 = await prisma.location.findFirst({
    where: { tenantId: tenant.id, name: "Building A - Floor 1" },
  });
  if (!loc1) {
    loc1 = await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: "Building A - Floor 1",
        path: "Building A/Floor 1",
      },
    });
  }
  let loc2 = await prisma.location.findFirst({
    where: { tenantId: tenant.id, name: "Building B - Workshop" },
  });
  if (!loc2) {
    loc2 = await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: "Building B - Workshop",
        path: "Building B/Workshop",
      },
    });
  }

  // Asset types
  const categories = ["tool", "instrument", "machine", "IT", "vehicle", "kit", "consumable"];
  const types = await Promise.all(
    categories.map(async (cat) => {
      let t = await prisma.assetType.findFirst({
        where: { tenantId: tenant!.id, category: cat },
      });
      if (!t) {
        t = await prisma.assetType.create({
          data: {
            tenantId: tenant!.id,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            category: cat,
            requiresCalibration: cat === "instrument",
          },
        });
      }
      return t;
    })
  );

  // Demo users - password: demo123
  const hash = await bcrypt.hash("demo123", 10);
  const emails = [
    { email: "admin@demo.com", name: "Admin User", role: "ADMIN" as const },
    { email: "mechanical@demo.com", name: "Mechanical User", role: "MECHANICAL" as const },
    { email: "electrical@demo.com", name: "Electrical User", role: "ELECTRICAL" as const },
    { email: "external@demo.com", name: "External User", role: "EXTERNAL" as const },
  ];
  const users: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const u of emails) {
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: u.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: u.email,
          displayName: u.name,
          passwordHash: hash,
          role: u.role,
        },
      });
    }
    users[u.role] = user;
  }

  for (const [roleName, org] of [
    ["MECHANICAL", mechanical],
    ["ELECTRICAL", electrical],
  ] as const) {
    const u = users[roleName];
    const existing = await prisma.userOrgUnit.findFirst({
      where: { userId: u.id, orgUnitId: org.id },
    });
    if (!existing) {
      await prisma.userOrgUnit.create({
        data: { userId: u.id, orgUnitId: org.id },
      });
    }
  }

  // Assets
  const existingAssets = await prisma.asset.count({ where: { tenantId: tenant.id } });
  if (existingAssets < assetLimit) {
    for (let i = existingAssets; i < assetLimit; i++) {
      const tag = `TAG-${String(i + 1).padStart(5, "0")}`;
      const type = types[i % types.length];
      const orgUnit = i % 2 === 0 ? mechanical : electrical;
      const assignedUserId = i === 0 ? users.EXTERNAL.id : null;

      await prisma.asset.upsert({
        where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: tag } },
        update: {},
        create: {
          tenantId: tenant.id,
          assetTypeId: type.id,
          assetTag: tag,
          serialNumber: `SN-${10000 + i}`,
          lifecycleState: "IN_SERVICE",
          ownerOrgUnitId: orgUnit.id,
          locationId: i % 2 === 0 ? loc1.id : loc2.id,
          assignedUserId,
          status: "IN_SERVICE",
          condition: i % 5 === 0 ? "FAIR" : "GOOD",
          criticality: i % 10 === 0 ? "HIGH" : "NORMAL",
          purchaseCost: 500 + i * 10,
          purchaseDate: new Date(2023, 0, 1),
        },
      });
    }
  }

  // Sample checkout (overdue)
  const asset1 = await prisma.asset.findFirst({
    where: { tenantId: tenant.id, assetTag: "TAG-00001" },
  });
  if (asset1) {
    const existing = await prisma.checkout.findFirst({
      where: { assetId: asset1.id, returnedAt: null },
    });
    if (!existing) {
      await prisma.checkout.create({
        data: {
          assetId: asset1.id,
          borrowerId: users.MECHANICAL.id,
          dueDate: new Date(Date.now() - 86400000),
          conditionOut: "GOOD",
        },
      });
    }
  }

  // Sample reservation
  const resAsset = await prisma.asset.findFirst({
    where: { tenantId: tenant.id, assetTag: "TAG-00002" },
  });
  if (resAsset) {
    const hasRes = await prisma.reservation.findFirst({
      where: { assetId: resAsset.id, status: "CONFIRMED" },
    });
    if (!hasRes) {
      await prisma.reservation.create({
        data: {
          assetId: resAsset.id,
          requesterId: users.MECHANICAL.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          status: "CONFIRMED",
        },
      });
    }
  }

  // Sample work order
  const woAsset = await prisma.asset.findFirst({
    where: { tenantId: tenant.id, assetTag: "TAG-00003" },
  });
  if (woAsset) {
    const hasWo = await prisma.workOrder.findFirst({
      where: { assetId: woAsset.id, status: "OPEN" },
    });
    if (!hasWo) {
      await prisma.workOrder.create({
        data: {
          assetId: woAsset.id,
          type: "corrective",
          priority: "HIGH",
          status: "OPEN",
          title: "Bearing replacement",
          description: "Noise in motor",
          assignedToId: users.MECHANICAL.id,
        },
      });
    }
  }

  // Sample calibration
  const calAsset2 = await prisma.asset.findFirst({
    where: {
      tenantId: tenant.id,
      assetType: { requiresCalibration: true },
    },
  });
  if (calAsset2) {
    await prisma.calibrationEvent.create({
      data: {
        assetId: calAsset2.id,
        performedDate: new Date(Date.now() - 180 * 86400000),
        result: "PASS",
        nextDueDate: new Date(Date.now() - 7 * 86400000),
      },
    }).catch(() => {});
  }

  // Depreciation
  const depAsset = await prisma.asset.findFirst({
    where: { tenantId: tenant.id, purchaseCost: { not: null } },
  });
  if (depAsset) {
    const existing = await prisma.depreciationBook.findFirst({
      where: { assetId: depAsset.id },
    });
    if (!existing) {
      await prisma.depreciationBook.create({
        data: {
          assetId: depAsset.id,
          method: "SL",
          usefulLife: 5,
          salvageValue: 50,
          startDate: depAsset.purchaseDate ?? new Date(),
          nbv: (depAsset.purchaseCost ?? 500) * 0.8,
        },
      });
    }
  }

  // Projects and Trolleys
  const projects = await Promise.all(
    ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"].map(async (name, i) => {
      let p = await prisma.project.findFirst({ where: { tenantId: tenant.id, name } });
      if (!p) {
        p = await prisma.project.create({ data: { tenantId: tenant.id, name } });
      }
      return p;
    })
  );

  const trolleyList: Awaited<ReturnType<typeof prisma.trolley.create>>[] = [];
  for (let i = 1; i <= 8; i++) {
    const code = `TR-${String(i).padStart(3, "0")}`;
    const proj = projects[(i - 1) % projects.length];
    const dept = i % 2 === 1 ? "Mechanical" : "Electrical";
    let t = await prisma.trolley.findFirst({
      where: { tenantId: tenant.id, trolleyCode: code },
    });
    if (!t) {
      t = await prisma.trolley.create({
        data: {
          tenantId: tenant.id,
          projectId: proj.id,
          trolleyCode: code,
          department: dept,
          status: i % 3 === 0 ? "INACTIVE" : "ACTIVE",
        },
      });
    }
    trolleyList.push(t);
  }

  // Assign some assets to trolleys
  const assetsToAssign = await prisma.asset.findMany({
    where: { tenantId: tenant.id },
    take: 50,
  });
  for (let i = 0; i < assetsToAssign.length; i++) {
    const a = assetsToAssign[i];
    const t = trolleyList[i % trolleyList.length];
    if (t) {
      await prisma.asset.update({
        where: { id: a.id },
        data: { trolleyId: t.id, projectId: t.projectId },
      });
    }
  }

  await prisma.auditLogEvent.create({
    data: {
      tenantId: tenant.id,
      actorUserId: users.ADMIN.id,
      entityType: "Tenant",
      entityId: tenant.id,
      action: "SEED",
      diffJson: JSON.stringify({ message: "Database seeded" }),
    },
  }).catch(() => {});

  console.log(`Seeded: ${assetLimit} assets, 4 users, org units, projects, trolleys, locations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
