-- CreateEnum
CREATE TYPE "CompanyTrustBadge" AS ENUM ('UNVERIFIED', 'NEW_MEMBER', 'ACTIVE_TRADER', 'TRUSTED_PARTNER', 'VERIFIED_BUSINESS');

-- CreateEnum
CREATE TYPE "RelationshipHealthStatus" AS ENUM ('NEW', 'ACTIVE', 'DORMANT', 'STRONG');

-- CreateTable
CREATE TABLE "NetworkTrustScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "badge" "CompanyTrustBadge" NOT NULL DEFAULT 'UNVERIFIED',
    "identityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "networkScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkTrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkTrustScore_tenantId_key" ON "NetworkTrustScore"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkTrustScore_profileId_key" ON "NetworkTrustScore"("profileId");

-- AddForeignKey
ALTER TABLE "NetworkTrustScore" ADD CONSTRAINT "NetworkTrustScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkTrustScore" ADD CONSTRAINT "NetworkTrustScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
