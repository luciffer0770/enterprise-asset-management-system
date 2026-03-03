-- CreateTable
CREATE TABLE "IssueRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerEmpId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "trolleyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approverId" TEXT,
    "decidedAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssueRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IssueRequest_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "Trolley" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IssueRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "IssueRequest_assetId_idx" ON "IssueRequest"("assetId");
CREATE INDEX "IssueRequest_requesterId_idx" ON "IssueRequest"("requesterId");
CREATE INDEX "IssueRequest_status_idx" ON "IssueRequest"("status");
