/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name]` on the table `CustomerCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `CustomerCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CustomerCategory_name_key";

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "CustomerCategory" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SuspendedSale" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Coupon_companyId_idx" ON "Coupon"("companyId");

-- CreateIndex
CREATE INDEX "CustomerCategory_companyId_idx" ON "CustomerCategory"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCategory_companyId_name_key" ON "CustomerCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "SuspendedSale_companyId_idx" ON "SuspendedSale"("companyId");

-- AddForeignKey
ALTER TABLE "CustomerCategory" ADD CONSTRAINT "CustomerCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspendedSale" ADD CONSTRAINT "SuspendedSale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
