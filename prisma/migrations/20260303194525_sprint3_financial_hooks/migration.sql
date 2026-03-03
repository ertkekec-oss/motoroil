-- CreateEnum
CREATE TYPE "DealerFinancialMode" AS ENUM ('ISOLATED', 'ERP_POSTING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'ACCOUNTING_POST_ATTEMPT';
ALTER TYPE "AuditEventType" ADD VALUE 'ACCOUNTING_POST_SUCCEEDED';
ALTER TYPE "AuditEventType" ADD VALUE 'ACCOUNTING_POST_FAILED';

-- AlterTable
ALTER TABLE "DealerMembership" ADD COLUMN     "financialMode" "DealerFinancialMode" NOT NULL DEFAULT 'ISOLATED';

-- AlterTable
ALTER TABLE "DealerPaymentIntent" ADD COLUMN     "accountingPostedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DealerRefund" ADD COLUMN     "accountingPostedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "accountingPostedAt" TIMESTAMP(3);
