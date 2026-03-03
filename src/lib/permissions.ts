import type { Role } from "./utils";

type Capability =
  | "assets:read"
  | "assets:write"
  | "assets:all"
  | "checkout"
  | "tickets:approve"
  | "trolleys"
  | "reservations"
  | "workorders:read"
  | "workorders:write"
  | "calibration:read"
  | "calibration:write"
  | "finance:read"
  | "finance:write"
  | "audit:read"
  | "audit:export"
  | "switch-role"
  | "users:manage";

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  ADMIN: [
    "assets:read",
    "assets:write",
    "assets:all",
    "checkout",
    "tickets:approve",
    "trolleys",
    "reservations",
    "workorders:read",
    "workorders:write",
    "calibration:read",
    "calibration:write",
    "finance:read",
    "finance:write",
    "audit:read",
    "audit:export",
    "switch-role",
    "users:manage",
  ],
  LAB_INCHARGE: [
    "assets:read",
    "assets:write",
    "checkout",
    "tickets:approve",
    "trolleys",
    "reservations",
    "workorders:read",
    "workorders:write",
    "calibration:read",
    "finance:read",
  ],
  MECHANICAL: [
    "assets:read",
    "assets:write",
    "checkout",
    "trolleys",
    "reservations",
    "workorders:read",
    "workorders:write",
    "calibration:read",
    "finance:read",
  ],
  ELECTRICAL: [
    "assets:read",
    "assets:write",
    "checkout",
    "trolleys",
    "reservations",
    "workorders:read",
    "workorders:write",
    "calibration:read",
    "finance:read",
  ],
  EXTERNAL: [
    "assets:read", // assigned only
    "checkout", // request tools via tickets
    "reservations",
    "calibration:read",
  ],
};

export function hasCapability(role: Role | string, capability: Capability): boolean {
  const caps = ROLE_CAPABILITIES[role as Role];
  if (!caps) return false;
  if (capability === "assets:all") return caps.includes("assets:all");
  if (capability === "assets:write") return caps.includes("assets:write") || caps.includes("assets:all");
  if (capability === "assets:read") return caps.includes("assets:read") || caps.includes("assets:all");
  return caps.includes(capability);
}

export function canAccessOrgUnit(role: Role | string, userOrgUnitIds: string[], assetOrgUnitId: string | null): boolean {
  if (role === "ADMIN") return true;
  if (!assetOrgUnitId) return true;
  return userOrgUnitIds?.includes(assetOrgUnitId) ?? false;
}

export function canAccessAsset(
  role: Role | string,
  userOrgUnitIds: string[],
  assignedUserId: string | null,
  assetOrgUnitId: string | null,
  userId: string
): boolean {
  if (role === "ADMIN") return true;
  if (role === "EXTERNAL") {
    return assignedUserId === userId;
  }
  return canAccessOrgUnit(role, userOrgUnitIds, assetOrgUnitId);
}
