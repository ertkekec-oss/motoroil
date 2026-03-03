-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "DealerRefund" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "DealerPaymentProvider" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "reason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "providerResult" JSONB,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealerRefund_idempotencyKey_key" ON "DealerRefund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DealerRefund_supplierTenantId_orderId_idx" ON "DealerRefund"("supplierTenantId", "orderId");

-- CreateIndex
CREATE INDEX "DealerRefund_supplierTenantId_status_idx" ON "DealerRefund"("supplierTenantId", "status");
