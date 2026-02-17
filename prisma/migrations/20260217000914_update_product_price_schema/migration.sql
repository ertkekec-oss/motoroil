/*
  Warnings:

  - A unique constraint covering the columns `[companyId,productId,priceListId]` on the table `ProductPrice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `ProductPrice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductPrice_productId_priceListId_key";

-- AlterTable
ALTER TABLE "ProductPrice" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "derivedFromListId" TEXT,
ADD COLUMN     "formulaMarkupBps" INTEGER;

-- CreateIndex
CREATE INDEX "ProductPrice_companyId_idx" ON "ProductPrice"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_companyId_productId_priceListId_key" ON "ProductPrice"("companyId", "productId", "priceListId");
