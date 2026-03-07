/*
  Warnings:

  - The values [CANCELED] on the enum `NetworkDisputeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `NetworkDisputeCase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NetworkDisputeEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR', 'SERVICE_PROVIDER', 'LOGISTICS', 'FINANCE');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('SUPPLIER', 'BUYER', 'PARTNER', 'SERVICE');

-- CreateEnum
CREATE TYPE "NetworkInventorySignalType" AS ENUM ('OVERSTOCK', 'STOCKOUT_RISK', 'HIGH_DEMAND', 'SEASONAL_DEMAND', 'SLOW_MOVING');

-- CreateEnum
CREATE TYPE "NetworkRecommendationTier" AS ENUM ('PRIMARY', 'SECONDARY', 'FALLBACK');

-- CreateEnum
CREATE TYPE "RoutingWaveCandidate" AS ENUM ('WAVE_1', 'WAVE_2', 'WAVE_3', 'NONE');

-- CreateEnum
CREATE TYPE "RFQRoutingStatus" AS ENUM ('DRAFT', 'READY', 'ROUTING', 'PARTIALLY_ROUTED', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RFQRoutingMode" AS ENUM ('MANUAL', 'ASSISTED', 'AUTO');

-- CreateEnum
CREATE TYPE "RFQRoutingWaveStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "CompanyRelationshipEventType" AS ENUM ('CREATED', 'INVITED', 'ACCEPTED', 'REJECTED', 'ACTIVATED', 'SUSPENDED', 'REACTIVATED', 'ARCHIVED', 'VISIBILITY_CHANGED', 'TYPE_CHANGED', 'NOTE_UPDATED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED', 'RETRIED');

-- CreateEnum
CREATE TYPE "NetworkMarketSignalScopeType" AS ENUM ('GLOBAL', 'REGION', 'CITY', 'CATEGORY', 'CATEGORY_REGION', 'NETWORK_CLUSTER');

-- CreateEnum
CREATE TYPE "NetworkMarketSignalType" AS ENUM ('DEMAND_SPIKE', 'DEMAND_GROWTH', 'SUPPLY_SURPLUS', 'SUPPLY_SHORTAGE', 'PRICE_PRESSURE', 'MARKET_HEAT', 'RFQ_SURGE', 'EMERGING_CATEGORY', 'NETWORK_CLUSTER_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "NetworkTrendDirection" AS ENUM ('UP', 'DOWN', 'FLAT', 'VOLATILE');

-- CreateEnum
CREATE TYPE "TenantMarketInsightType" AS ENUM ('SELL_OPPORTUNITY', 'BUY_OPPORTUNITY', 'CATEGORY_TO_WATCH', 'DEMAND_RISK', 'SUPPLY_RISK', 'RFQ_OPPORTUNITY', 'PRICE_ADVANTAGE_WINDOW', 'NETWORK_EXPANSION_HINT');

-- CreateEnum
CREATE TYPE "TenantRecommendedAction" AS ENUM ('OPEN_B2B_LISTING', 'CREATE_RFQ', 'REVIEW_SUPPLIERS', 'EXPAND_CATEGORY', 'ACTIVATE_ROUTING', 'WAIT_AND_MONITOR', 'BOOST_VISIBILITY');

-- CreateEnum
CREATE TYPE "CarrierAccountType" AS ENUM ('PLATFORM_MANAGED', 'TENANT_MANAGED');

-- CreateEnum
CREATE TYPE "NetworkShipmentStatus" AS ENUM ('DRAFT', 'LABEL_PENDING', 'LABEL_CREATED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'CANCELED', 'RETURNED');

-- CreateEnum
CREATE TYPE "NetworkShipmentDirection" AS ENUM ('OUTBOUND', 'RETURN', 'REPLACEMENT');

-- CreateEnum
CREATE TYPE "NetworkShipmentType" AS ENUM ('STANDARD', 'PARTIAL', 'SPLIT', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "NetworkShipmentPackageStatus" AS ENUM ('PENDING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED');

-- CreateEnum
CREATE TYPE "NetworkShipmentTrackingNormalizedStatus" AS ENUM ('LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_EXCEPTION', 'CANCELED', 'RETURNED');

-- CreateEnum
CREATE TYPE "NetworkShipmentLabelRequestStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "NetworkEscrowTransactionType" AS ENUM ('DEPOSIT', 'HOLD', 'RELEASE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "NetworkEscrowTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "NetworkEscrowHoldStatus" AS ENUM ('CREATED', 'FUNDS_HELD', 'SHIPMENT_PENDING', 'IN_TRANSIT', 'DELIVERY_CONFIRMED', 'DISPUTED', 'RELEASED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NetworkEscrowReleaseStrategy" AS ENUM ('DELIVERY_PLUS_DELAY', 'BUYER_CONFIRMATION', 'INSTANT_FOR_TRUSTED', 'ADMIN_REVIEW');

-- CreateEnum
CREATE TYPE "NetworkEscrowLifecycleEventType" AS ENUM ('ESCROW_CREATED', 'FUNDS_CAPTURED', 'SHIPMENT_CREATED', 'SHIPMENT_PICKED_UP', 'SHIPMENT_DELIVERED', 'SHIPMENT_DELIVERY_FAILED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'ESCROW_RELEASE_SCHEDULED', 'ESCROW_RELEASED', 'ESCROW_REFUNDED');

-- CreateEnum
CREATE TYPE "NetworkDisputeType" AS ENUM ('DELIVERY_NOT_RECEIVED', 'WRONG_ITEM', 'DAMAGED_ITEM', 'MISSING_ITEMS', 'DELIVERY_DELAY', 'PARTIAL_DELIVERY', 'REFUND_REQUEST', 'PAYMENT_DISPUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "NetworkDisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NetworkDisputeEvidenceType" AS ENUM ('PHOTO', 'DOCUMENT', 'DELIVERY_RECEIPT', 'CARRIER_PROOF', 'INVOICE', 'MESSAGE_LOG', 'TEXT_STATEMENT', 'SYSTEM_EVENT_SNAPSHOT');

-- CreateEnum
CREATE TYPE "NetworkDisputeEvidenceVisibility" AS ENUM ('ADMIN_ONLY', 'BOTH_PARTIES', 'UPLOADER_AND_ADMIN');

-- CreateEnum
CREATE TYPE "NetworkDisputeTimelineEventType" AS ENUM ('DISPUTE_OPENED', 'EVIDENCE_ADDED', 'COUNTERPARTY_RESPONDED', 'ADMIN_NOTE_ADDED', 'ESCROW_LOCKED', 'ESCROW_RELEASED', 'ESCROW_REFUNDED', 'SHIPMENT_DELIVERED', 'SHIPMENT_FAILED', 'RESOLUTION_PROPOSED', 'RESOLUTION_ACCEPTED', 'RESOLUTION_REJECTED', 'DISPUTE_RESOLVED', 'DISPUTE_CLOSED');

-- CreateEnum
CREATE TYPE "NetworkDisputeActorType" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NetworkDisputeDecision" AS ENUM ('FULL_REFUND', 'FULL_RELEASE', 'PARTIAL_REFUND', 'PARTIAL_RELEASE', 'REJECT_CLAIM', 'MANUAL_SETTLEMENT');

-- CreateEnum
CREATE TYPE "NetworkDisputeDecidedByType" AS ENUM ('ADMIN', 'SYSTEM', 'MUTUAL');

-- DropForeignKey
ALTER TABLE "NetworkDisputeEvent" DROP CONSTRAINT "NetworkDisputeEvent_disputeCaseId_fkey";

-- DropTable
DROP TABLE "NetworkDisputeEvent";
DROP TABLE "NetworkDisputeCase";

-- DropEnum
DROP TYPE "NetworkDisputeAction";
DROP TYPE "NetworkDisputeReason";

-- AlterEnum
BEGIN;
CREATE TYPE "NetworkDisputeStatus_new" AS ENUM ('OPEN', 'EVIDENCE_PENDING', 'UNDER_REVIEW', 'WAITING_COUNTERPARTY', 'ADMIN_REVIEW', 'RESOLVED', 'CLOSED', 'REJECTED');
ALTER TYPE "NetworkDisputeStatus" RENAME TO "NetworkDisputeStatus_old";
ALTER TYPE "NetworkDisputeStatus_new" RENAME TO "NetworkDisputeStatus";
DROP TYPE "NetworkDisputeStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "CompanyRelationship" ADD COLUMN     "healthStatus" "RelationshipHealthStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "lastActivityAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NetworkCompanyProfile" ADD COLUMN     "profileCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "NetworkTrustScore" ADD COLUMN     "calculationVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "supersededAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NetworkCapability" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "capabilityType" "CapabilityType" NOT NULL,
    "keywords" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCategorySignal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "strengthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "lastCalculatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkCategorySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkRecommendation" (
    "id" TEXT NOT NULL,
    "viewerTenantId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "recommendationType" "RecommendationType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "lastCalculatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "NetworkRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkInventorySignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productCategoryId" TEXT NOT NULL,
    "signalType" "NetworkInventorySignalType" NOT NULL,
    "quantityBand" TEXT,
    "velocityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityScope" TEXT NOT NULL DEFAULT 'NETWORK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "lastCalculatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "NetworkInventorySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeOpportunity" (
    "id" TEXT NOT NULL,
    "supplierProfileId" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "signalType" "NetworkInventorySignalType" NOT NULL,
    "opportunityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "lastCalculatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "NetworkTradeOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkSupplierScore" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT,
    "opportunityId" TEXT,
    "buyerTenantId" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "supplierProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreBreakdown" JSONB,
    "recommendationTier" "NetworkRecommendationTier" NOT NULL DEFAULT 'FALLBACK',
    "waveCandidate" "RoutingWaveCandidate" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkSupplierScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkRoutingPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "autoRoutingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxPrimarySuppliers" INTEGER NOT NULL DEFAULT 3,
    "maxFallbackSuppliers" INTEGER NOT NULL DEFAULT 5,
    "minTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "minConfidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "allowWaveRouting" BOOLEAN NOT NULL DEFAULT true,
    "allowAutoDraftCreation" BOOLEAN NOT NULL DEFAULT false,
    "requireManualApprovalBeforeSend" BOOLEAN NOT NULL DEFAULT true,
    "preferredSupplierTypes" JSONB,
    "excludedSupplierIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkRoutingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQRoutingSession" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "buyerTenantId" TEXT NOT NULL,
    "status" "RFQRoutingStatus" NOT NULL DEFAULT 'DRAFT',
    "routingMode" "RFQRoutingMode" NOT NULL DEFAULT 'ASSISTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentWave" INTEGER NOT NULL DEFAULT 1,
    "totalCandidates" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQRoutingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQRoutingWave" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "waveNumber" INTEGER NOT NULL,
    "plannedSuppliersCount" INTEGER NOT NULL DEFAULT 0,
    "routedSuppliersCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RFQRoutingWaveStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RFQRoutingWave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRelationshipEvent" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "sourceTenantId" TEXT NOT NULL,
    "targetTenantId" TEXT NOT NULL,
    "eventType" "CompanyRelationshipEventType" NOT NULL,
    "previousStatus" "CompanyRelationshipStatus",
    "nextStatus" "CompanyRelationshipStatus",
    "metadata" JSONB,
    "actorTenantId" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyRelationshipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkProcessingCheckpoint" (
    "id" TEXT NOT NULL,
    "processorType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "lastProcessedAt" TIMESTAMP(3),
    "payloadHash" TEXT,
    "resultHash" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkProcessingCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyGraphAdjacencyCache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "neighborTenantId" TEXT NOT NULL,
    "relationshipCount" INTEGER NOT NULL DEFAULT 1,
    "directConnection" BOOLEAN NOT NULL DEFAULT true,
    "shortestPathDistance" INTEGER,
    "mutualConnectionsCount" INTEGER NOT NULL DEFAULT 0,
    "sharedCategoryCount" INTEGER NOT NULL DEFAULT 0,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "lastRelationshipEventId" TEXT,
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyGraphAdjacencyCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyGraphMetricSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "directConnectionsCount" INTEGER NOT NULL DEFAULT 0,
    "activeSuppliersCount" INTEGER NOT NULL DEFAULT 0,
    "activeBuyersCount" INTEGER NOT NULL DEFAULT 0,
    "mutualNetworkDensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryDiversityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "lastRelationshipEventId" TEXT,
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyGraphMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkAutomationPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "autoRecommendationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoOpportunityGenerationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRFQDraftEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRoutingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requireManualApprovalForRouting" BOOLEAN NOT NULL DEFAULT true,
    "minTrustScoreForAutomation" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "minConfidenceForAutomation" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "allowFallbackRouting" BOOLEAN NOT NULL DEFAULT false,
    "restrictedSupplierHandling" TEXT NOT NULL DEFAULT 'EXCLUDE',
    "excludedRelationshipStatuses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkAutomationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCalculationRegistry" (
    "modelName" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkCalculationRegistry_pkey" PRIMARY KEY ("modelName")
);

-- CreateTable
CREATE TABLE "NetworkMarketSignal" (
    "id" TEXT NOT NULL,
    "signalScopeType" "NetworkMarketSignalScopeType" NOT NULL,
    "categoryId" TEXT,
    "regionCode" TEXT,
    "city" TEXT,
    "clusterKey" TEXT,
    "signalType" "NetworkMarketSignalType" NOT NULL,
    "intensityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportingSignalCount" INTEGER NOT NULL DEFAULT 0,
    "trendDirection" "NetworkTrendDirection" NOT NULL DEFAULT 'FLAT',
    "signalSummary" TEXT NOT NULL,
    "explanationJson" JSONB,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkMarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMarketInsight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT,
    "insightType" "TenantMarketInsightType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "explanationJson" JSONB,
    "relatedMarketSignalId" TEXT,
    "recommendedAction" "TenantRecommendedAction" NOT NULL,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMarketInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "carrierCode" TEXT NOT NULL,
    "accountType" "CarrierAccountType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkShipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "sellerTenantId" TEXT,
    "buyerTenantId" TEXT,
    "carrierCode" TEXT NOT NULL,
    "externalShipmentId" TEXT,
    "trackingNumber" TEXT,
    "labelFileKey" TEXT,
    "status" "NetworkShipmentStatus" NOT NULL,
    "shipmentDirection" "NetworkShipmentDirection" NOT NULL,
    "shipmentType" "NetworkShipmentType" NOT NULL,
    "totalPackages" INTEGER NOT NULL DEFAULT 1,
    "totalWeight" DOUBLE PRECISION,
    "currency" TEXT,
    "shippingCost" DOUBLE PRECISION,
    "shippedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkShipmentPackage" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "packageNo" INTEGER NOT NULL,
    "externalPackageId" TEXT,
    "trackingNumber" TEXT,
    "barcode" TEXT,
    "weight" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "status" "NetworkShipmentPackageStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkShipmentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "shipmentPackageId" TEXT,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkShipmentTrackingEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "shipmentPackageId" TEXT,
    "carrierCode" TEXT NOT NULL,
    "externalEventId" TEXT,
    "carrierEventCode" TEXT,
    "normalizedStatus" "NetworkShipmentTrackingNormalizedStatus" NOT NULL,
    "locationText" TEXT,
    "description" TEXT,
    "rawPayload" JSONB,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkShipmentTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkShipmentLabelRequest" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "requestStatus" "NetworkShipmentLabelRequestStatus" NOT NULL,
    "requestPayloadHash" TEXT,
    "responsePayloadHash" TEXT,
    "errorCode" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkShipmentLabelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEscrowAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lockedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkEscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEscrowTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "escrowId" TEXT NOT NULL,
    "transactionType" "NetworkEscrowTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "NetworkEscrowTransactionStatus" NOT NULL,
    "externalPaymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "NetworkEscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEscrowHold" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerTenantId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "NetworkEscrowHoldStatus" NOT NULL,
    "releaseStrategy" "NetworkEscrowReleaseStrategy" NOT NULL,
    "releaseDelayHours" INTEGER NOT NULL DEFAULT 48,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "NetworkEscrowHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEscrowLifecycleEvent" (
    "id" TEXT NOT NULL,
    "escrowHoldId" TEXT NOT NULL,
    "eventType" "NetworkEscrowLifecycleEventType" NOT NULL,
    "previousState" TEXT,
    "newState" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkEscrowLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDispute" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "escrowHoldId" TEXT,
    "openedByTenantId" TEXT NOT NULL,
    "againstTenantId" TEXT NOT NULL,
    "disputeType" "NetworkDisputeType" NOT NULL,
    "status" "NetworkDisputeStatus" NOT NULL,
    "priority" "NetworkDisputePriority" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "claimedAmount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'TRY',
    "resolutionType" "NetworkDisputeDecision",
    "resolutionSummary" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedByTenantId" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "evidenceType" "NetworkDisputeEvidenceType" NOT NULL,
    "fileKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "textContent" TEXT,
    "metadata" JSONB,
    "visibilityScope" "NetworkDisputeEvidenceVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkDisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDisputeTimelineEvent" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "eventType" "NetworkDisputeTimelineEventType" NOT NULL,
    "actorType" "NetworkDisputeActorType" NOT NULL,
    "actorTenantId" TEXT,
    "actorUserId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkDisputeTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDisputeResolution" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "decidedByType" "NetworkDisputeDecidedByType" NOT NULL,
    "decidedByUserId" TEXT,
    "decision" "NetworkDisputeDecision" NOT NULL,
    "refundAmount" DOUBLE PRECISION,
    "releaseAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkDisputeResolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkCapability_categoryId_idx" ON "NetworkCapability"("categoryId");

-- CreateIndex
CREATE INDEX "NetworkCapability_profileId_idx" ON "NetworkCapability"("profileId");

-- CreateIndex
CREATE INDEX "NetworkCategorySignal_categoryId_strengthScore_status_idx" ON "NetworkCategorySignal"("categoryId", "strengthScore", "status");

-- CreateIndex
CREATE INDEX "NetworkCategorySignal_calculationVersion_isStale_idx" ON "NetworkCategorySignal"("calculationVersion", "isStale");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCategorySignal_profileId_categoryId_key" ON "NetworkCategorySignal"("profileId", "categoryId");

-- CreateIndex
CREATE INDEX "NetworkRecommendation_viewerTenantId_recommendationType_sta_idx" ON "NetworkRecommendation"("viewerTenantId", "recommendationType", "status");

-- CreateIndex
CREATE INDEX "NetworkRecommendation_targetProfileId_idx" ON "NetworkRecommendation"("targetProfileId");

-- CreateIndex
CREATE INDEX "NetworkRecommendation_score_idx" ON "NetworkRecommendation"("score");

-- CreateIndex
CREATE INDEX "NetworkRecommendation_calculationVersion_isStale_idx" ON "NetworkRecommendation"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "NetworkInventorySignal_tenantId_status_idx" ON "NetworkInventorySignal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkInventorySignal_profileId_idx" ON "NetworkInventorySignal"("profileId");

-- CreateIndex
CREATE INDEX "NetworkInventorySignal_productCategoryId_signalType_status_idx" ON "NetworkInventorySignal"("productCategoryId", "signalType", "status");

-- CreateIndex
CREATE INDEX "NetworkInventorySignal_calculationVersion_isStale_idx" ON "NetworkInventorySignal"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "NetworkTradeOpportunity_supplierProfileId_status_idx" ON "NetworkTradeOpportunity"("supplierProfileId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeOpportunity_buyerProfileId_status_idx" ON "NetworkTradeOpportunity"("buyerProfileId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeOpportunity_categoryId_signalType_status_idx" ON "NetworkTradeOpportunity"("categoryId", "signalType", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeOpportunity_calculationVersion_isStale_idx" ON "NetworkTradeOpportunity"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "NetworkSupplierScore_buyerTenantId_idx" ON "NetworkSupplierScore"("buyerTenantId");

-- CreateIndex
CREATE INDEX "NetworkSupplierScore_supplierTenantId_idx" ON "NetworkSupplierScore"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkSupplierScore_supplierProfileId_idx" ON "NetworkSupplierScore"("supplierProfileId");

-- CreateIndex
CREATE INDEX "NetworkSupplierScore_rfqId_idx" ON "NetworkSupplierScore"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkRoutingPolicy_tenantId_key" ON "NetworkRoutingPolicy"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQRoutingSession_rfqId_key" ON "RFQRoutingSession"("rfqId");

-- CreateIndex
CREATE INDEX "RFQRoutingSession_buyerTenantId_idx" ON "RFQRoutingSession"("buyerTenantId");

-- CreateIndex
CREATE INDEX "RFQRoutingSession_rfqId_idx" ON "RFQRoutingSession"("rfqId");

-- CreateIndex
CREATE INDEX "RFQRoutingWave_sessionId_idx" ON "RFQRoutingWave"("sessionId");

-- CreateIndex
CREATE INDEX "CompanyRelationshipEvent_relationshipId_idx" ON "CompanyRelationshipEvent"("relationshipId");

-- CreateIndex
CREATE INDEX "CompanyRelationshipEvent_sourceTenantId_targetTenantId_idx" ON "CompanyRelationshipEvent"("sourceTenantId", "targetTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkProcessingCheckpoint_idempotencyKey_key" ON "NetworkProcessingCheckpoint"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NetworkProcessingCheckpoint_processorType_processingStatus_idx" ON "NetworkProcessingCheckpoint"("processorType", "processingStatus");

-- CreateIndex
CREATE INDEX "NetworkProcessingCheckpoint_entityId_idx" ON "NetworkProcessingCheckpoint"("entityId");

-- CreateIndex
CREATE INDEX "NetworkProcessingCheckpoint_expiresAt_idx" ON "NetworkProcessingCheckpoint"("expiresAt");

-- CreateIndex
CREATE INDEX "CompanyGraphAdjacencyCache_tenantId_idx" ON "CompanyGraphAdjacencyCache"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyGraphAdjacencyCache_tenantId_neighborTenantId_key" ON "CompanyGraphAdjacencyCache"("tenantId", "neighborTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyGraphMetricSnapshot_tenantId_key" ON "CompanyGraphMetricSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "CompanyGraphMetricSnapshot_tenantId_idx" ON "CompanyGraphMetricSnapshot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAutomationPolicy_tenantId_key" ON "NetworkAutomationPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkMarketSignal_signalType_status_expiresAt_idx" ON "NetworkMarketSignal"("signalType", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "NetworkMarketSignal_categoryId_regionCode_status_idx" ON "NetworkMarketSignal"("categoryId", "regionCode", "status");

-- CreateIndex
CREATE INDEX "NetworkMarketSignal_calculationVersion_isStale_idx" ON "NetworkMarketSignal"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "NetworkMarketSignal_trendDirection_confidenceScore_idx" ON "NetworkMarketSignal"("trendDirection", "confidenceScore");

-- CreateIndex
CREATE INDEX "TenantMarketInsight_tenantId_insightType_status_idx" ON "TenantMarketInsight"("tenantId", "insightType", "status");

-- CreateIndex
CREATE INDEX "TenantMarketInsight_tenantId_priority_status_idx" ON "TenantMarketInsight"("tenantId", "priority", "status");

-- CreateIndex
CREATE INDEX "TenantMarketInsight_categoryId_status_idx" ON "TenantMarketInsight"("categoryId", "status");

-- CreateIndex
CREATE INDEX "TenantMarketInsight_calculationVersion_isStale_idx" ON "TenantMarketInsight"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "CarrierAccount_carrierCode_isActive_idx" ON "CarrierAccount"("carrierCode", "isActive");

-- CreateIndex
CREATE INDEX "CarrierAccount_tenantId_idx" ON "CarrierAccount"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkShipment_tenantId_status_createdAt_idx" ON "NetworkShipment"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkShipment_sellerTenantId_buyerTenantId_createdAt_idx" ON "NetworkShipment"("sellerTenantId", "buyerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkShipment_orderId_status_idx" ON "NetworkShipment"("orderId", "status");

-- CreateIndex
CREATE INDEX "NetworkShipment_carrierCode_trackingNumber_idx" ON "NetworkShipment"("carrierCode", "trackingNumber");

-- CreateIndex
CREATE INDEX "NetworkShipment_externalShipmentId_idx" ON "NetworkShipment"("externalShipmentId");

-- CreateIndex
CREATE INDEX "NetworkShipmentPackage_externalPackageId_idx" ON "NetworkShipmentPackage"("externalPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkShipmentPackage_shipmentId_packageNo_key" ON "NetworkShipmentPackage"("shipmentId", "packageNo");

-- CreateIndex
CREATE INDEX "NetworkShipmentItem_shipmentId_idx" ON "NetworkShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "NetworkShipmentItem_orderItemId_idx" ON "NetworkShipmentItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkShipmentTrackingEvent_dedupeKey_key" ON "NetworkShipmentTrackingEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkShipmentTrackingEvent_shipmentId_eventTime_idx" ON "NetworkShipmentTrackingEvent"("shipmentId", "eventTime");

-- CreateIndex
CREATE INDEX "NetworkShipmentTrackingEvent_normalizedStatus_eventTime_idx" ON "NetworkShipmentTrackingEvent"("normalizedStatus", "eventTime");

-- CreateIndex
CREATE INDEX "NetworkShipmentTrackingEvent_externalEventId_idx" ON "NetworkShipmentTrackingEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "NetworkShipmentLabelRequest_shipmentId_requestStatus_idx" ON "NetworkShipmentLabelRequest"("shipmentId", "requestStatus");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkEscrowAccount_tenantId_key" ON "NetworkEscrowAccount"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkEscrowTransaction_escrowId_status_idx" ON "NetworkEscrowTransaction"("escrowId", "status");

-- CreateIndex
CREATE INDEX "NetworkEscrowTransaction_transactionType_status_idx" ON "NetworkEscrowTransaction"("transactionType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkEscrowHold_orderId_key" ON "NetworkEscrowHold"("orderId");

-- CreateIndex
CREATE INDEX "NetworkEscrowHold_buyerTenantId_createdAt_idx" ON "NetworkEscrowHold"("buyerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkEscrowHold_sellerTenantId_createdAt_idx" ON "NetworkEscrowHold"("sellerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkEscrowHold_orderId_status_idx" ON "NetworkEscrowHold"("orderId", "status");

-- CreateIndex
CREATE INDEX "NetworkEscrowLifecycleEvent_escrowHoldId_createdAt_idx" ON "NetworkEscrowLifecycleEvent"("escrowHoldId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkDispute_orderId_status_idx" ON "NetworkDispute"("orderId", "status");

-- CreateIndex
CREATE INDEX "NetworkDispute_shipmentId_status_idx" ON "NetworkDispute"("shipmentId", "status");

-- CreateIndex
CREATE INDEX "NetworkDispute_escrowHoldId_status_idx" ON "NetworkDispute"("escrowHoldId", "status");

-- CreateIndex
CREATE INDEX "NetworkDispute_tenantId_createdAt_idx" ON "NetworkDispute"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkDispute_disputeType_status_priority_idx" ON "NetworkDispute"("disputeType", "status", "priority");

-- CreateIndex
CREATE INDEX "NetworkDisputeEvidence_disputeId_createdAt_idx" ON "NetworkDisputeEvidence"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkDisputeEvidence_uploadedByTenantId_createdAt_idx" ON "NetworkDisputeEvidence"("uploadedByTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkDisputeTimelineEvent_disputeId_createdAt_idx" ON "NetworkDisputeTimelineEvent"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkDisputeResolution_disputeId_createdAt_idx" ON "NetworkDisputeResolution"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkTrustScore_calculationVersion_isStale_idx" ON "NetworkTrustScore"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "NetworkTrustScore_status_expiresAt_idx" ON "NetworkTrustScore"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "NetworkCapability" ADD CONSTRAINT "NetworkCapability_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCategorySignal" ADD CONSTRAINT "NetworkCategorySignal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkRecommendation" ADD CONSTRAINT "NetworkRecommendation_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkInventorySignal" ADD CONSTRAINT "NetworkInventorySignal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkTradeOpportunity" ADD CONSTRAINT "NetworkTradeOpportunity_supplierProfileId_fkey" FOREIGN KEY ("supplierProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkTradeOpportunity" ADD CONSTRAINT "NetworkTradeOpportunity_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkSupplierScore" ADD CONSTRAINT "NetworkSupplierScore_supplierProfileId_fkey" FOREIGN KEY ("supplierProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkRoutingPolicy" ADD CONSTRAINT "NetworkRoutingPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQRoutingWave" ADD CONSTRAINT "RFQRoutingWave_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RFQRoutingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelationshipEvent" ADD CONSTRAINT "CompanyRelationshipEvent_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "CompanyRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkAutomationPolicy" ADD CONSTRAINT "NetworkAutomationPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMarketInsight" ADD CONSTRAINT "TenantMarketInsight_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMarketInsight" ADD CONSTRAINT "TenantMarketInsight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierAccount" ADD CONSTRAINT "CarrierAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipment" ADD CONSTRAINT "NetworkShipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentPackage" ADD CONSTRAINT "NetworkShipmentPackage_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "NetworkShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentItem" ADD CONSTRAINT "NetworkShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "NetworkShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentItem" ADD CONSTRAINT "NetworkShipmentItem_shipmentPackageId_fkey" FOREIGN KEY ("shipmentPackageId") REFERENCES "NetworkShipmentPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentTrackingEvent" ADD CONSTRAINT "NetworkShipmentTrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "NetworkShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentTrackingEvent" ADD CONSTRAINT "NetworkShipmentTrackingEvent_shipmentPackageId_fkey" FOREIGN KEY ("shipmentPackageId") REFERENCES "NetworkShipmentPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkShipmentLabelRequest" ADD CONSTRAINT "NetworkShipmentLabelRequest_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "NetworkShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEscrowAccount" ADD CONSTRAINT "NetworkEscrowAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEscrowTransaction" ADD CONSTRAINT "NetworkEscrowTransaction_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "NetworkEscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEscrowLifecycleEvent" ADD CONSTRAINT "NetworkEscrowLifecycleEvent_escrowHoldId_fkey" FOREIGN KEY ("escrowHoldId") REFERENCES "NetworkEscrowHold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDispute" ADD CONSTRAINT "NetworkDispute_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDisputeEvidence" ADD CONSTRAINT "NetworkDisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "NetworkDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDisputeTimelineEvent" ADD CONSTRAINT "NetworkDisputeTimelineEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "NetworkDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDisputeResolution" ADD CONSTRAINT "NetworkDisputeResolution_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "NetworkDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
