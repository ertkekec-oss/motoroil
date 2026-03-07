-- CreateEnum
CREATE TYPE "NetworkReputationTier" AS ENUM ('NEW', 'DEVELOPING', 'STABLE', 'HIGH_CONFIDENCE', 'PREMIUM', 'WATCHLIST', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "NetworkReputationSignalType" AS ENUM ('TRUST_STRONG', 'SHIPPING_RELIABLE', 'SHIPPING_UNRELIABLE', 'HIGH_DISPUTE_RATE', 'LOW_DISPUTE_RATE', 'RFQ_RESPONSE_STRONG', 'RFQ_RESPONSE_WEAK', 'ESCROW_REFUND_HEAVY', 'ESCROW_SUCCESSFUL', 'STRONG_MARKET_ACTIVITY', 'STRONG_CLUSTER_POSITION', 'WATCHLIST_PATTERN', 'ADMIN_RESTRICTION', 'PAYMENT_BEHAVIOR_POSITIVE', 'PAYMENT_BEHAVIOR_NEGATIVE');

-- CreateEnum
CREATE TYPE "NetworkReputationSignalDirection" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "NetworkReputationTrendDirection" AS ENUM ('UP', 'DOWN', 'STABLE', 'VOLATILE');

-- CreateTable
CREATE TABLE "NetworkReputationScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "supplierScore" DOUBLE PRECISION,
    "buyerScore" DOUBLE PRECISION,
    "partnerScore" DOUBLE PRECISION,
    "trustComponentScore" DOUBLE PRECISION NOT NULL,
    "shippingComponentScore" DOUBLE PRECISION NOT NULL,
    "disputeComponentScore" DOUBLE PRECISION NOT NULL,
    "routingComponentScore" DOUBLE PRECISION NOT NULL,
    "escrowComponentScore" DOUBLE PRECISION NOT NULL,
    "activityComponentScore" DOUBLE PRECISION NOT NULL,
    "marketComponentScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reputationTier" "NetworkReputationTier" NOT NULL,
    "explanationJson" JSONB NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReputationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkReputationSignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT,
    "signalType" "NetworkReputationSignalType" NOT NULL,
    "signalDirection" "NetworkReputationSignalDirection" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "scoreImpact" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "explanationJson" JSONB NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "calculationVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReputationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkReputationSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "reputationTier" "NetworkReputationTier" NOT NULL,
    "scoreChangeDelta" DOUBLE PRECISION,
    "trendDirection" "NetworkReputationTrendDirection" NOT NULL,
    "topPositiveSignalCount" INTEGER NOT NULL,
    "topNegativeSignalCount" INTEGER NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReputationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkReputationScore_dedupeKey_key" ON "NetworkReputationScore"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkReputationScore_tenantId_status_createdAt_idx" ON "NetworkReputationScore"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkReputationScore_profileId_status_idx" ON "NetworkReputationScore"("profileId", "status");

-- CreateIndex
CREATE INDEX "NetworkReputationScore_reputationTier_status_idx" ON "NetworkReputationScore"("reputationTier", "status");

-- CreateIndex
CREATE INDEX "NetworkReputationScore_overallScore_status_idx" ON "NetworkReputationScore"("overallScore", "status");

-- CreateIndex
CREATE INDEX "NetworkReputationScore_calculationVersion_isStale_idx" ON "NetworkReputationScore"("calculationVersion", "isStale");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkReputationSignal_dedupeKey_key" ON "NetworkReputationSignal"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkReputationSignal_tenantId_status_createdAt_idx" ON "NetworkReputationSignal"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkReputationSignal_signalType_status_createdAt_idx" ON "NetworkReputationSignal"("signalType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkReputationSnapshot_tenantId_createdAt_idx" ON "NetworkReputationSnapshot"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkReputationSnapshot_trendDirection_reputationTier_idx" ON "NetworkReputationSnapshot"("trendDirection", "reputationTier");
