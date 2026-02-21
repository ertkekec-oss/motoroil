-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "detailsFetchedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE INDEX "SalesInvoice_orderId_idx" ON "SalesInvoice"("orderId");
