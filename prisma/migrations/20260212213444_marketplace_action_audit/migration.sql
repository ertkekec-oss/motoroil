-- CreateTable
CREATE TABLE "MarketplaceActionAudit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "orderId" TEXT,
    "actionKey" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceActionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceActionAudit_idempotencyKey_key" ON "MarketplaceActionAudit"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MarketplaceActionAudit_companyId_marketplace_createdAt_idx" ON "MarketplaceActionAudit"("companyId", "marketplace", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceActionAudit_orderId_idx" ON "MarketplaceActionAudit"("orderId");
