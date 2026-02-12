/*
  Warnings:

  - You are about to drop the column `accessToken` on the `BankConnection` table. All the data in the column will be lost.
  - You are about to drop the column `consentId` on the `BankConnection` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `BankConnection` table. All the data in the column will be lost.
  - You are about to drop the column `providerRef` on the `BankConnection` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `BankConnection` table. All the data in the column will be lost.
  - You are about to drop the column `referenceNo` on the `BankTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `BankTransaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `BankTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(14,2)`.
  - A unique constraint covering the columns `[iban]` on the table `BankConnection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bankConnectionId,transactionFingerprint]` on the table `BankTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `BankConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionFingerprint` to the `BankTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BankTransaction_bankConnectionId_transactionId_key";

-- DropIndex
DROP INDEX "Order_orderNumber_key";

-- AlterTable
ALTER TABLE "BankConnection" DROP COLUMN "accessToken",
DROP COLUMN "consentId",
DROP COLUMN "provider",
DROP COLUMN "providerRef",
DROP COLUMN "refreshToken",
ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "connectionType" TEXT NOT NULL DEFAULT 'OPEN_BANKING',
ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "credentialsEncrypted" JSONB,
ADD COLUMN     "credentialsVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "integrationMethod" TEXT NOT NULL DEFAULT 'MANUAL_UPLOAD',
ADD COLUMN     "lastErrorAt" TIMESTAMP(3),
ADD COLUMN     "lastErrorCode" TEXT,
ADD COLUMN     "lastErrorMessage" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'TRY',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "BankTransaction" DROP COLUMN "referenceNo",
DROP COLUMN "status",
ADD COLUMN     "bankRef" TEXT,
ADD COLUMN     "transactionFingerprint" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "MarketplaceProductPnl" ADD COLUMN     "refundedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_iban_key" ON "BankConnection"("iban");

-- CreateIndex
CREATE INDEX "BankConnection_companyId_bankId_idx" ON "BankConnection"("companyId", "bankId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_bankConnectionId_transactionFingerprint_key" ON "BankTransaction"("bankConnectionId", "transactionFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_companyId_key" ON "Customer"("email", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_companyId_orderNumber_key" ON "Order"("companyId", "orderNumber");

-- AddForeignKey
ALTER TABLE "Kasa" ADD CONSTRAINT "Kasa_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
