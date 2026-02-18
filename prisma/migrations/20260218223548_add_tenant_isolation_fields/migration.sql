/*
  Warnings:

  - A unique constraint covering the columns `[companyId,key]` on the table `AppSettings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,marketplace,marketplaceCode]` on the table `MarketplaceProductMap` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `AppSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `MarketplaceProductMap` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AppSettings_key_key";

-- DropIndex
DROP INDEX "MarketplaceProductMap_marketplace_marketplaceCode_key";

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExternalRequest" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "MarketplaceProductMap" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AppSettings_companyId_idx" ON "AppSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_companyId_key_key" ON "AppSettings"("companyId", "key");

-- CreateIndex
CREATE INDEX "ExternalRequest_companyId_idx" ON "ExternalRequest"("companyId");

-- CreateIndex
CREATE INDEX "MarketplaceProductMap_companyId_idx" ON "MarketplaceProductMap"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceProductMap_companyId_marketplace_marketplaceCode_key" ON "MarketplaceProductMap"("companyId", "marketplace", "marketplaceCode");

-- AddForeignKey
ALTER TABLE "MarketplaceProductMap" ADD CONSTRAINT "MarketplaceProductMap_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRequest" ADD CONSTRAINT "ExternalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
