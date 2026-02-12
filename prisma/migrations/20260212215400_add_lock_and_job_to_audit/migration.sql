-- AlterTable
ALTER TABLE "MarketplaceActionAudit" ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "lockExpiresAt" TIMESTAMP(3);
