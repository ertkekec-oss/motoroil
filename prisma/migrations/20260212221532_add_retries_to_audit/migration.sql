-- AlterTable
ALTER TABLE "MarketplaceActionAudit" ADD COLUMN     "failureHistory" JSONB,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MarketplaceLabel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "shipmentPackageId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplaceLabel_companyId_createdAt_idx" ON "MarketplaceLabel"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceLabel_companyId_marketplace_shipmentPackageId_key" ON "MarketplaceLabel"("companyId", "marketplace", "shipmentPackageId");
