-- CreateEnum
CREATE TYPE "AccountingOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'CREDIT_LIMIT_EXCEEDED';
ALTER TYPE "AuditEventType" ADD VALUE 'CREDIT_LIMIT_OVERRIDE_APPROVE';
ALTER TYPE "AuditEventType" ADD VALUE 'CREDIT_LIMIT_FORCE_PAYMENT';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "creditExceededAmount" DECIMAL(12,2),
ADD COLUMN     "isLimitExceeded" BOOLEAN DEFAULT false,
ADD COLUMN     "paymentRequired" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "AccountingOutbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "AccountingOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingOutbox_dedupeKey_key" ON "AccountingOutbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "AccountingOutbox_tenantId_status_idx" ON "AccountingOutbox"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AccountingOutbox_nextRetryAt_idx" ON "AccountingOutbox"("nextRetryAt");
