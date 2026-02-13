/*
  Warnings:

  - A unique constraint covering the columns `[companyId,type]` on the table `MarketplaceConfig` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `MarketplaceConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "MarketplaceConfig_type_key";

-- AlterTable
ALTER TABLE "MarketplaceConfig" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipmentPackageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceConfig_companyId_type_key" ON "MarketplaceConfig"("companyId", "type");
