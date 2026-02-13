-- AlterTable
ALTER TABLE "MarketplaceConfig" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MarketplaceConfig_deletedAt_idx" ON "MarketplaceConfig"("deletedAt");
