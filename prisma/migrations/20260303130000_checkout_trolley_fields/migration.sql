-- AlterTable Checkout: add borrowerName, borrowerEmpId, reason, trolleyId
ALTER TABLE "Checkout" ADD COLUMN "borrowerName" TEXT;
ALTER TABLE "Checkout" ADD COLUMN "borrowerEmpId" TEXT;
ALTER TABLE "Checkout" ADD COLUMN "reason" TEXT;
ALTER TABLE "Checkout" ADD COLUMN "trolleyId" TEXT;
CREATE INDEX "Checkout_trolleyId_idx" ON "Checkout"("trolleyId");
