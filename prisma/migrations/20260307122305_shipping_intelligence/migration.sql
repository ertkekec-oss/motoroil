-- CreateEnum
CREATE TYPE "NetworkOperationalSignalType" AS ENUM ('LATE_DELIVERY_RISK', 'HIGH_DISPUTE_RATE', 'CARRIER_UNDERPERFORMANCE', 'STRONG_DELIVERY_RELIABILITY', 'REFUND_RISK', 'ESCROW_DELAY_PATTERN');

-- CreateTable
CREATE TABLE "NetworkShippingReliabilityScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "onTimeDeliveryScore" DOUBLE PRECISION NOT NULL,
    "disputePenaltyScore" DOUBLE PRECISION NOT NULL,
    "deliverySuccessScore" DOUBLE PRECISION NOT NULL,
    "refundPenaltyScore" DOUBLE PRECISION NOT NULL,
    "carrierDiversityScore" DOUBLE PRECISION,
    "completedShipmentCount" INTEGER NOT NULL,
    "completedDisputeCount" INTEGER NOT NULL,
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

    CONSTRAINT "NetworkShippingReliabilityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCarrierPerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "regionCode" TEXT,
    "city" TEXT,
    "onTimeRate" DOUBLE PRECISION NOT NULL,
    "deliverySuccessRate" DOUBLE PRECISION NOT NULL,
    "failureRate" DOUBLE PRECISION NOT NULL,
    "avgDeliveryHours" DOUBLE PRECISION,
    "shipmentCount" INTEGER NOT NULL,
    "disputeLinkedShipmentCount" INTEGER NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "NetworkCarrierPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkOperationalSignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "profileId" TEXT,
    "carrierCode" TEXT,
    "signalType" "NetworkOperationalSignalType" NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanationJson" JSONB NOT NULL,
    "relatedShipmentId" TEXT,
    "relatedDisputeId" TEXT,
    "calculationVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkOperationalSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkShippingReliabilityScore_dedupeKey_key" ON "NetworkShippingReliabilityScore"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkShippingReliabilityScore_tenantId_status_isStale_idx" ON "NetworkShippingReliabilityScore"("tenantId", "status", "isStale");

-- CreateIndex
CREATE INDEX "NetworkShippingReliabilityScore_profileId_status_idx" ON "NetworkShippingReliabilityScore"("profileId", "status");

-- CreateIndex
CREATE INDEX "NetworkShippingReliabilityScore_calculationVersion_dedupeKe_idx" ON "NetworkShippingReliabilityScore"("calculationVersion", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCarrierPerformanceSnapshot_dedupeKey_key" ON "NetworkCarrierPerformanceSnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkCarrierPerformanceSnapshot_carrierCode_status_isStal_idx" ON "NetworkCarrierPerformanceSnapshot"("carrierCode", "status", "isStale");

-- CreateIndex
CREATE INDEX "NetworkCarrierPerformanceSnapshot_carrierCode_regionCode_st_idx" ON "NetworkCarrierPerformanceSnapshot"("carrierCode", "regionCode", "status");

-- CreateIndex
CREATE INDEX "NetworkCarrierPerformanceSnapshot_calculationVersion_dedupe_idx" ON "NetworkCarrierPerformanceSnapshot"("calculationVersion", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkOperationalSignal_dedupeKey_key" ON "NetworkOperationalSignal"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_tenantId_status_isStale_idx" ON "NetworkOperationalSignal"("tenantId", "status", "isStale");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_profileId_status_idx" ON "NetworkOperationalSignal"("profileId", "status");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_carrierCode_status_idx" ON "NetworkOperationalSignal"("carrierCode", "status");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_relatedShipmentId_idx" ON "NetworkOperationalSignal"("relatedShipmentId");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_relatedDisputeId_idx" ON "NetworkOperationalSignal"("relatedDisputeId");

-- CreateIndex
CREATE INDEX "NetworkOperationalSignal_calculationVersion_dedupeKey_idx" ON "NetworkOperationalSignal"("calculationVersion", "dedupeKey");
