-- CreateTable
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Trolley" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trolleyCode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trolley_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trolley_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Trolley_tenantId_trolleyCode_key" ON "Trolley"("tenantId", "trolleyCode");

-- AlterTable Asset: add locationPath, trolleyId, projectId (ignore if exists - SQLite has no IF NOT EXISTS for columns)
-- Use PRAGMA table_info to check; simpler: run each and ignore duplicate column error
-- For maximum compatibility: only add if missing. SQLite doesn't support that directly.
-- Rely on migration running once on fresh DB. For already-pushed DB: mark migration applied.
ALTER TABLE "Asset" ADD COLUMN "locationPath" TEXT;
ALTER TABLE "Asset" ADD COLUMN "trolleyId" TEXT;
ALTER TABLE "Asset" ADD COLUMN "projectId" TEXT;

-- Add foreign keys for Asset (SQLite requires separate statements)
-- Note: SQLite doesn't support ADD CONSTRAINT in ALTER TABLE, so we add references via new table if needed.
-- For SQLite we use REFERENCES in a CREATE TABLE, but ALTER TABLE ADD COLUMN doesn't support REFERENCES.
-- We'll add the columns without FK - Prisma will handle the relation in the client.
-- The columns are already added above. For SQLite, FK enforcement is optional.
-- Add indexes for the new foreign key columns to improve queries
CREATE INDEX "Asset_trolleyId_idx" ON "Asset"("trolleyId");
CREATE INDEX "Asset_projectId_idx" ON "Asset"("projectId");

-- CreateTable ReturnTicket
CREATE TABLE "ReturnTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkoutId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "raisedById" TEXT NOT NULL,
    "approverId" TEXT,
    "decisionNote" TEXT,
    "decidedAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReturnTicket_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnTicket_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnTicket_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex for ReturnTicket
CREATE UNIQUE INDEX "ReturnTicket_checkoutId_key" ON "ReturnTicket"("checkoutId");

-- CreateTable TicketApproval
CREATE TABLE "TicketApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketApproval_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ReturnTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- DropTable IntegrationConfig
DROP TABLE IF EXISTS "IntegrationConfig";
