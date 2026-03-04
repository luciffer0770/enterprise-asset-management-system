-- AlterTable
ALTER TABLE "InventoryPool" ADD COLUMN "code" TEXT;
ALTER TABLE "InventoryPool" ADD COLUMN "kind" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Checkout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "checkedOutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "returnedAt" DATETIME,
    "conditionOut" TEXT,
    "conditionIn" TEXT,
    "notes" TEXT,
    "reason" TEXT,
    "requestedByName" TEXT,
    "requestedByEmployeeId" TEXT,
    "poolId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Checkout_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Checkout_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Checkout_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InventoryPool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Checkout" ("assetId", "borrowerId", "checkedOutAt", "conditionIn", "conditionOut", "createdAt", "dueDate", "id", "notes", "returnedAt") SELECT "assetId", "borrowerId", "checkedOutAt", "conditionIn", "conditionOut", "createdAt", "dueDate", "id", "notes", "returnedAt" FROM "Checkout";
DROP TABLE "Checkout";
ALTER TABLE "new_Checkout" RENAME TO "Checkout";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
