-- CreateEnum
CREATE TYPE "DealerCreditPolicy" AS ENUM ('HARD_LIMIT', 'SOFT_LIMIT', 'FORCE_CARD_ON_LIMIT');

-- CreateTable
CREATE TABLE "DealerNetworkSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "creditPolicy" "DealerCreditPolicy" NOT NULL DEFAULT 'HARD_LIMIT',
    "hardLimitBlock" BOOLEAN NOT NULL DEFAULT true,
    "forceCardOnLimit" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequiresPaymentIfFlagged" BOOLEAN NOT NULL DEFAULT true,
    "showLimitOnCartUI" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerNetworkSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealerNetworkSettings_tenantId_key" ON "DealerNetworkSettings"("tenantId");
