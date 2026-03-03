#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env");
const examplePath = path.join(process.cwd(), ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  const content = fs.readFileSync(examplePath, "utf8");
  const defaults = `DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="industrial-tooling-demo-secret-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"
TENANT_NAME="Tooling Dept"
ASSET_VOLUME_TIER="small"
AUTH_MODE="local+rbac"
UI_DENSITY="compact"
`;
  fs.writeFileSync(envPath, defaults);
  console.log("Created .env from defaults (DATABASE_URL, NEXTAUTH_SECRET, etc.)");
}
