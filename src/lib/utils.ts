import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export const ASSET_LIFECYCLE_STATES = [
  "REQUESTED",
  "ORDERED",
  "RECEIVED",
  "TAGGED",
  "IN_SERVICE",
  "RESERVED",
  "CHECKED_OUT",
  "UNDER_MAINTENANCE",
  "UNDER_CALIBRATION",
  "QUARANTINED",
  "LOST",
  "RETIRED",
  "DISPOSED",
] as const;

export type AssetLifecycleState = (typeof ASSET_LIFECYCLE_STATES)[number];

export const ROLES = ["ADMIN", "LAB_INCHARGE", "MECHANICAL", "ELECTRICAL", "EXTERNAL"] as const;
export type Role = (typeof ROLES)[number];

export const TENANT_NAME = process.env.TENANT_NAME ?? "Tooling Dept";
export const UI_DENSITY = process.env.UI_DENSITY ?? "compact";
