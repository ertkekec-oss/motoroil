-- CreateEnum
CREATE TYPE "DealerAuthMode" AS ENUM ('PASSWORD_ONLY', 'OTP_ONLY', 'OTP_OR_PASSWORD');

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'DEALER_AUTH_MODE_CHANGED';

-- CreateTable
CREATE TABLE "TenantPortalConfig" (
    "tenantId" TEXT NOT NULL,
    "dealerAuthMode" "DealerAuthMode" NOT NULL DEFAULT 'PASSWORD_ONLY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPortalConfig_pkey" PRIMARY KEY ("tenantId")
);
