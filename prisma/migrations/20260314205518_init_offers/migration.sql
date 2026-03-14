/*
  Warnings:

  - The values [PENDING,COUNTERED] on the enum `OfferStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `queryHash` on the `GraphQueryAuditLog` table. All the data in the column will be lost.
  - You are about to alter the column `salesVat` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `purchaseVat` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - The `status` column on the `SellerOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Quote` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[b2bCustomDomain]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('POS', 'SALES_REP', 'B2B', 'HUB', 'MANUAL', 'GLOBAL');

-- CreateEnum
CREATE TYPE "CampaignStackingRule" AS ENUM ('EXCLUSIVE', 'STACKABLE', 'PRIORITY_ONLY');

-- CreateEnum
CREATE TYPE "HelpArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SellerOfferStatus" AS ENUM ('PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NetworkTradeRiskContextType" AS ENUM ('TENANT', 'COUNTERPARTY_PAIR', 'ORDER', 'ESCROW', 'SHIPMENT');

-- CreateEnum
CREATE TYPE "NetworkTradeRiskTier" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "NetworkTradeRiskSignalType" AS ENUM ('HIGH_DISPUTE_PROBABILITY', 'LOW_PAYMENT_RELIABILITY', 'REFUND_HEAVY_PATTERN', 'HIGH_SHIPPING_FAILURE_RATE', 'STRONG_REPUTATION_PROTECTION', 'TRUSTED_COUNTERPARTY_PAIR', 'NEW_UNPROVEN_RELATIONSHIP', 'ESCROW_DELAY_REQUIRED', 'MANUAL_REVIEW_REQUIRED', 'STRONG_DELIVERY_HISTORY', 'HIGH_RISK_CLUSTER', 'WATCHLIST_COUNTERPARTY');

-- CreateEnum
CREATE TYPE "NetworkTradeRiskSignalDirection" AS ENUM ('RISK_UP', 'RISK_DOWN', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "NetworkEscrowPolicyDecisionType" AS ENUM ('AUTO_APPROVED', 'STANDARD_ESCROW', 'EXTENDED_HOLD', 'BUYER_CONFIRMATION_REQUIRED', 'MANUAL_REVIEW', 'RESTRICTED_FLOW');

-- CreateEnum
CREATE TYPE "SystemJobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'DEAD_LETTER', 'CANCELED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SystemJobPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SystemJobExecutionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'RETRIED');

-- CreateEnum
CREATE TYPE "NetworkLiquidityOpportunityType" AS ENUM ('SUPPLY_SURPLUS', 'DEMAND_SHORTAGE', 'DIRECT_MATCH', 'CLUSTER_MATCH');

-- CreateEnum
CREATE TYPE "NetworkLiquidityOpportunityStatus" AS ENUM ('DISCOVERED', 'RANKED', 'ROUTED', 'CONSUMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NetworkLiquidityMatchStatus" AS ENUM ('CANDIDATE', 'PROPOSED', 'ROUTED', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "NetworkTradeProposalStatus" AS ENUM ('SUGGESTION', 'DRAFT', 'PROPOSED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER');

-- CreateEnum
CREATE TYPE "NetworkTradePolicyMode" AS ENUM ('DISCOVERY_ONLY', 'SUGGEST_ONLY', 'AUTO_RFQ', 'AUTO_ROUTE');

-- CreateEnum
CREATE TYPE "NetworkTradeProposalMessageType" AS ENUM ('COMMENT', 'COUNTER_OFFER', 'QUANTITY_CHANGE', 'PRICE_CHANGE', 'SHIPPING_CHANGE');

-- CreateEnum
CREATE TYPE "NetworkTradeProposalDecisionType" AS ENUM ('ACCEPT', 'REJECT', 'EXPIRE', 'MANUAL_CANCEL');

-- CreateEnum
CREATE TYPE "NetworkVisibilityLevel" AS ENUM ('PUBLIC', 'NETWORK_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "NetworkTradeAbuseSignalType" AS ENUM ('RFQ_SPAM', 'NEGOTIATION_ABUSE', 'PRICE_MANIPULATION');

-- CreateEnum
CREATE TYPE "NetworkAccessLevel" AS ENUM ('UNVERIFIED', 'LIMITED_NETWORK', 'FULL_NETWORK', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "PlatformDocumentCategory" AS ENUM ('CONTRACT', 'FORM', 'POLICY', 'GUIDE');

-- CreateEnum
CREATE TYPE "PlatformDocumentTargetModule" AS ENUM ('GENERAL', 'SIGNUP', 'BANK_INTEGRATION', 'B2B_MARKETPLACE', 'FIELD_SALES', 'E_INVOICE', 'E_ARCHIVE', 'HUMAN_RESOURCES', 'INVENTORY_MANAGEMENT', 'POS_TERMINAL', 'CRM', 'ERP_INTEGRATION', 'PAYMENTS');

-- CreateEnum
CREATE TYPE "PlatformDocumentApprovalMethod" AS ENUM ('CHECKBOX', 'OTP');

-- CreateEnum
CREATE TYPE "PlatformDocumentContentType" AS ENUM ('PDF', 'TEXT');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('ERP', 'FINANCE', 'INVENTORY', 'SALESX', 'B2B_HUB', 'INTEGRATION', 'EINVOICE', 'SHIPPING', 'BILLING', 'ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketAuthorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HelpConversationRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PlatformHealthStatus" AS ENUM ('OK', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "PlatformIncidentType" AS ENUM ('INTEGRATION_FAILURE', 'API_ERROR', 'PAYMENT_FAILURE', 'EINVOICE_FAILURE', 'SMS_FAILURE', 'SYNC_FAILURE', 'IMPORT_FAILURE', 'WORKER_FAILURE');

-- CreateEnum
CREATE TYPE "PlatformIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlatformIncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'AUTO_RESOLVED');

-- CreateEnum
CREATE TYPE "RunbookActionType" AS ENUM ('RETRY_JOB', 'RESET_WEBHOOK', 'RESTART_WORKER', 'REFRESH_TOKEN', 'RECONNECT_API', 'CLEAR_CACHE');

-- CreateEnum
CREATE TYPE "SupportSLAStatus" AS ENUM ('ACTIVE', 'BREACHED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('DOCUMENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ManufacturingOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- AlterEnum
BEGIN;
CREATE TYPE "OfferStatus_new" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER', 'CANCELLED');
ALTER TABLE "SellerOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Offer" ALTER COLUMN "status" TYPE "OfferStatus_new" USING ("status"::text::"OfferStatus_new");
ALTER TABLE "OfferStatusHistory" ALTER COLUMN "oldStatus" TYPE "OfferStatus_new" USING ("oldStatus"::text::"OfferStatus_new");
ALTER TABLE "OfferStatusHistory" ALTER COLUMN "newStatus" TYPE "OfferStatus_new" USING ("newStatus"::text::"OfferStatus_new");
ALTER TYPE "OfferStatus" RENAME TO "OfferStatus_old";
ALTER TYPE "OfferStatus_new" RENAME TO "OfferStatus";
DROP TYPE "OfferStatus_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SignatureAuditAction" ADD VALUE 'RECIPIENT_REVISION_REQUESTED';
ALTER TYPE "SignatureAuditAction" ADD VALUE 'ENVELOPE_REVISION_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SignatureEnvelopeStatus" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "SignatureEnvelopeStatus" ADD VALUE 'REVISION_REJECTED';

-- AlterEnum
ALTER TYPE "SignatureRecipientStatus" ADD VALUE 'REVISION_REQUESTED';

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_customerId_fkey";

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "campaignType" TEXT,
ADD COLUMN     "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "channels" "CampaignChannel"[] DEFAULT ARRAY[]::"CampaignChannel"[],
ADD COLUMN     "customerSegment" TEXT,
ADD COLUMN     "hubVisibility" TEXT,
ADD COLUMN     "minOrderAmount" DOUBLE PRECISION,
ADD COLUMN     "minQuantity" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "regionId" TEXT,
ADD COLUMN     "salesRepId" TEXT,
ADD COLUMN     "stackingRule" "CampaignStackingRule" NOT NULL DEFAULT 'STACKABLE',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Check" ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "otpPhone" TEXT,
ADD COLUMN     "otpToken" TEXT,
ADD COLUMN     "signatureStatus" TEXT DEFAULT 'Bekliyor',
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedDocumentUrl" TEXT;

-- AlterTable
ALTER TABLE "GraphQueryAuditLog" DROP COLUMN "queryHash",
ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "HelpCategory" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "documentName" VARCHAR(1024),
ADD COLUMN     "documentUrl" VARCHAR(2048),
ADD COLUMN     "gtin" TEXT,
ADD COLUMN     "invoiceTitle" TEXT,
ADD COLUMN     "purchaseOtv" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "shelfLocation" TEXT,
ADD COLUMN     "showDescriptionOnInvoice" BOOLEAN DEFAULT false,
ADD COLUMN     "status" TEXT DEFAULT 'Aktif',
ADD COLUMN     "tags" TEXT,
ALTER COLUMN "salesVat" SET DEFAULT 20,
ALTER COLUMN "salesVat" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "purchaseVat" SET DEFAULT 20,
ALTER COLUMN "purchaseVat" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "SellerOffer" DROP COLUMN "status",
ADD COLUMN     "status" "SellerOfferStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "b2bCustomDomain" TEXT;

-- DropTable
DROP TABLE "Quote";

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ownerUserId" TEXT,
    "createdBy" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "winProbability" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLine" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT,
    "productSnapshot" JSONB,
    "description" TEXT,
    "quantity" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Adet',
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferTerm" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "paymentTerm" TEXT,
    "paymentDueDays" INTEGER,
    "deliveryTerm" TEXT,
    "shipmentType" TEXT,
    "partialShipmentAllowed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferStatusHistory" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "oldStatus" "OfferStatus",
    "newStatus" "OfferStatus" NOT NULL,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferActivity" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "HelpArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "HelpTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpSearchIndex" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "titleVector" TEXT,
    "contentVector" TEXT,
    "tags" TEXT[],

    CONSTRAINT "HelpSearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeRiskScore" (
    "id" TEXT NOT NULL,
    "buyerTenantId" TEXT,
    "sellerTenantId" TEXT,
    "orderId" TEXT,
    "escrowHoldId" TEXT,
    "contextType" "NetworkTradeRiskContextType" NOT NULL,
    "overallRiskScore" DOUBLE PRECISION NOT NULL,
    "paymentReliabilityScore" DOUBLE PRECISION NOT NULL,
    "disputeProbabilityScore" DOUBLE PRECISION NOT NULL,
    "shippingRiskScore" DOUBLE PRECISION NOT NULL,
    "reputationRiskScore" DOUBLE PRECISION NOT NULL,
    "escrowRiskScore" DOUBLE PRECISION NOT NULL,
    "routingRiskScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "riskTier" "NetworkTradeRiskTier" NOT NULL,
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

    CONSTRAINT "NetworkTradeRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeRiskSignal" (
    "id" TEXT NOT NULL,
    "buyerTenantId" TEXT,
    "sellerTenantId" TEXT,
    "relatedOrderId" TEXT,
    "relatedEscrowHoldId" TEXT,
    "signalType" "NetworkTradeRiskSignalType" NOT NULL,
    "signalDirection" "NetworkTradeRiskSignalDirection" NOT NULL,
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

    CONSTRAINT "NetworkTradeRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEscrowPolicyDecision" (
    "id" TEXT NOT NULL,
    "escrowHoldId" TEXT NOT NULL,
    "buyerTenantId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "riskScoreId" TEXT,
    "decisionType" "NetworkEscrowPolicyDecisionType" NOT NULL,
    "releaseStrategy" TEXT NOT NULL,
    "holdDays" INTEGER NOT NULL,
    "disputeWindowHours" INTEGER NOT NULL,
    "manualReviewRequired" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "explanationJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkEscrowPolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkPaymentReliabilitySnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "successfulEscrowCount" INTEGER NOT NULL,
    "refundedEscrowCount" INTEGER NOT NULL,
    "disputedEscrowCount" INTEGER NOT NULL,
    "avgReleaseDelayHours" DOUBLE PRECISION,
    "paymentReliabilityScore" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "NetworkPaymentReliabilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemJob" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "SystemJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SystemJobPriority" NOT NULL DEFAULT 'NORMAL',
    "tenantId" TEXT,
    "moduleScope" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "backoffStrategy" TEXT,
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "resultSummary" TEXT,
    "lockedByWorker" TEXT,
    "lockExpiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemJobExecutionLog" (
    "id" TEXT NOT NULL,
    "systemJobId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "workerName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "SystemJobExecutionStatus" NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemJobExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDeadLetterJob" (
    "id" TEXT NOT NULL,
    "originalJobId" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "tenantId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "failedAttempts" INTEGER NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDeadLetterJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemWorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "hostInfo" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "activeJobCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemWorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLiquidityOpportunity" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "productRef" TEXT,
    "regionCode" TEXT,
    "supplyTenantId" TEXT,
    "demandTenantId" TEXT,
    "clusterId" TEXT,
    "opportunityType" "NetworkLiquidityOpportunityType" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidityVolumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "routingEligibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingFeasibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialSafetyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "NetworkLiquidityOpportunityStatus" NOT NULL DEFAULT 'DISCOVERED',
    "expiresAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "explainJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkLiquidityOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLiquidityMatch" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "buyerTenantId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "productRef" TEXT,
    "categoryId" TEXT,
    "graphDistance" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingReliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedPriceRangeLow" DOUBLE PRECISION,
    "estimatedPriceRangeHigh" DOUBLE PRECISION,
    "finalMatchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "NetworkLiquidityMatchStatus" NOT NULL DEFAULT 'CANDIDATE',
    "explainJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkLiquidityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLiquiditySnapshot" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "regionCode" TEXT,
    "supplyVolumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demandVolumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidityGapScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clusterNodeCount" INTEGER NOT NULL DEFAULT 0,
    "activeSupplierCount" INTEGER NOT NULL DEFAULT 0,
    "activeBuyerCount" INTEGER NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkLiquiditySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeProposal" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "liquidityMatchId" TEXT NOT NULL,
    "buyerTenantId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "productRef" TEXT,
    "proposedQuantityLow" INTEGER NOT NULL DEFAULT 0,
    "proposedQuantityHigh" INTEGER NOT NULL DEFAULT 0,
    "proposedPriceLow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proposedPriceHigh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "shippingMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "paymentMode" TEXT NOT NULL DEFAULT 'ESCROW',
    "escrowRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "NetworkTradeProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "policyMode" "NetworkTradePolicyMode" NOT NULL DEFAULT 'SUGGEST_ONLY',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkTradeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeProposalMessage" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "senderTenantId" TEXT NOT NULL,
    "messageType" "NetworkTradeProposalMessageType" NOT NULL DEFAULT 'COMMENT',
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkTradeProposalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeProposalDecision" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "decisionType" "NetworkTradeProposalDecisionType" NOT NULL,
    "decidedByTenantId" TEXT,
    "autoPolicy" BOOLEAN NOT NULL DEFAULT false,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkTradeProposalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkPriceSignal" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "regionCode" TEXT,
    "medianPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p25Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p75Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceVolatility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplyPressureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demandPressureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkPriceSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkSupplierCapacity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "estimatedDailyCapacity" INTEGER NOT NULL DEFAULT 0,
    "estimatedWeeklyCapacity" INTEGER NOT NULL DEFAULT 0,
    "avgLeadTimeDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipmentThroughputScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fulfillmentSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capacityConfidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkSupplierCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDiscoveryProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT,
    "categories" JSONB,
    "regions" JSONB,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "shippingReliability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capacityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityLevel" "NetworkVisibilityLevel" NOT NULL DEFAULT 'NETWORK_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkDiscoveryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeAbuseSignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signalType" "NetworkTradeAbuseSignalType" NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contextJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkTradeAbuseSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkTradeSnapshot" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "regionCode" TEXT,
    "tradeVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDealSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeSupplierCount" INTEGER NOT NULL DEFAULT 0,
    "activeBuyerCount" INTEGER NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkTradeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkComplianceProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationLevel" TEXT NOT NULL DEFAULT 'TIER_1',
    "businessType" TEXT,
    "riskFlags" JSONB,
    "networkAccessLevel" "NetworkAccessLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkComplianceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTaxonomyNode" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTaxonomyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "normalizedName" TEXT NOT NULL,
    "taxonomyNodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantProductMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "canonicalProductId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCluster" (
    "id" TEXT NOT NULL,
    "canonicalProductId" TEXT,
    "clusterKey" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSimilarity" (
    "id" TEXT NOT NULL,
    "tenantProductMappingId" TEXT,
    "canonicalProductId" TEXT,
    "comparedName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "matchType" TEXT NOT NULL,
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMatchSuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "canonicalProductId" TEXT NOT NULL,
    "suggestedScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMatchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyIdentity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "tradeRegistryNo" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVerificationDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTrustProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyIdentityId" TEXT,
    "identityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disputeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustLevel" TEXT NOT NULL DEFAULT 'LOW',
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTrustProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTrustSignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalValue" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "sourceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTrustSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTrustScoreHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "trustLevel" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "explanationJson" TEXT,

    CONSTRAINT "CompanyTrustScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "canonicalProductId" TEXT,
    "signalType" TEXT NOT NULL,
    "signalStrength" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesVelocity" DOUBLE PRECISION,
    "stockLevel" DOUBLE PRECISION,
    "projectedDaysToStockout" DOUBLE PRECISION,
    "reorderRecommendation" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSignalHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "canonicalProductId" TEXT,
    "signalType" TEXT NOT NULL,
    "signalStrength" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "explanationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSignalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecastSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "canonicalProductId" TEXT,
    "avgDailySales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWeeklySales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysToStockout" DOUBLE PRECISION,
    "recommendedReorderQty" DOUBLE PRECISION,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeLedgerEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "buyerTenantId" TEXT,
    "sellerTenantId" TEXT,
    "canonicalProductId" TEXT,
    "productId" TEXT,
    "opportunityId" TEXT,
    "proposalId" TEXT,
    "contractId" TEXT,
    "escrowId" TEXT,
    "shipmentId" TEXT,
    "disputeId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventStatus" TEXT,
    "amount" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "currency" TEXT,
    "metadataJson" JSONB,
    "sourceType" TEXT,
    "sourceRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeLedgerLink" (
    "id" TEXT NOT NULL,
    "ledgerEntryId" TEXT NOT NULL,
    "linkedEntityType" TEXT NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeLedgerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkGrowthTrigger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "buyerTenantId" TEXT,
    "sellerTenantId" TEXT,
    "canonicalProductId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerStrength" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkGrowthTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkGrowthAction" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT,
    "targetRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkGrowthAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDocument" (
    "id" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "PlatformDocumentCategory" NOT NULL DEFAULT 'CONTRACT',
    "targetModule" "PlatformDocumentTargetModule" NOT NULL DEFAULT 'GENERAL',
    "approvalMethod" "PlatformDocumentApprovalMethod" NOT NULL DEFAULT 'CHECKBOX',
    "contentType" "PlatformDocumentContentType" NOT NULL DEFAULT 'PDF',
    "fileKey" TEXT,
    "textContent" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDocumentApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersion" INTEGER NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "methodUsed" "PlatformDocumentApprovalMethod" NOT NULL,
    "otpVerifiedToken" TEXT,

    CONSTRAINT "TenantDocumentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "merchantId" TEXT,
    "supportedTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingProduct" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "planId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCredit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "smsCredits" INTEGER NOT NULL DEFAULT 0,
    "smsUsed" INTEGER NOT NULL DEFAULT 0,
    "einvoiceCredits" INTEGER NOT NULL DEFAULT 0,
    "einvoiceUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gatewayProvider" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalReference" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalTarget" DECIMAL(12,2) NOT NULL,
    "bonusPool" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetPeriod" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "target" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetAssignment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "target" DECIMAL(12,2) NOT NULL,
    "bonusPotential" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "actual" DECIMAL(12,2) NOT NULL,
    "achievement" DECIMAL(5,4) NOT NULL,
    "isCumulative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusResult" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "baseBonus" DECIMAL(12,2) NOT NULL,
    "accelerator" DECIMAL(5,2) NOT NULL,
    "finalBonus" DECIMAL(12,2) NOT NULL,
    "isRecovered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementBadge" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AchievementBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "scoreType" TEXT NOT NULL,
    "scoreValue" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITargetSuggestion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "safeTarget" DECIMAL(12,2) NOT NULL,
    "balancedTarget" DECIMAL(12,2) NOT NULL,
    "aggressiveTarget" DECIMAL(12,2) NOT NULL,
    "analysisData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AITargetSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueInsight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesForecast" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "targetPeriod" TEXT NOT NULL,
    "expectedSales" DECIMAL(12,2) NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPerformanceScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "achievementScore" INTEGER NOT NULL DEFAULT 0,
    "growthScore" INTEGER NOT NULL DEFAULT 0,
    "consistencyScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPerformanceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOpportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "potentialValue" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRiskAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "threshold" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesXInsight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceId" TEXT,
    "targetStaffId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesXInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesXOpportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "potentialValue" DECIMAL(12,2) NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesXOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveVisit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3) NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "assignedStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictiveVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "routeData" JSONB NOT NULL,
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOnboardingProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstInvoice" BOOLEAN NOT NULL DEFAULT false,
    "firstCustomer" BOOLEAN NOT NULL DEFAULT false,
    "inventoryViewed" BOOLEAN NOT NULL DEFAULT false,
    "salesXViewed" BOOLEAN NOT NULL DEFAULT false,
    "b2bHubViewed" BOOLEAN NOT NULL DEFAULT false,
    "completedPct" INTEGER NOT NULL DEFAULT 0,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "completedKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "href" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDiagnosticEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "autoFixAction" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformDiagnosticEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "category" "SupportTicketCategory" NOT NULL,
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentPage" TEXT,
    "browserInfo" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorType" "SupportTicketAuthorType" NOT NULL DEFAULT 'USER',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "HelpConversationRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRecommendation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformHealthCheck" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" "PlatformHealthStatus" NOT NULL DEFAULT 'OK',
    "message" TEXT,
    "metadataJson" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformIncident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "PlatformIncidentType" NOT NULL,
    "severity" "PlatformIncidentSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PlatformIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlatformIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRunbook" (
    "id" TEXT NOT NULL,
    "incidentType" "PlatformIncidentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "autoFixAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRunbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunbookAction" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "actionType" "RunbookActionType" NOT NULL,
    "configJson" JSONB,

    CONSTRAINT "RunbookAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketTagMap" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "SupportTicketTagMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSLA" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "priority" "SupportTicketPriority" NOT NULL,
    "firstResponseMinutes" INTEGER NOT NULL,
    "resolutionMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportSLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSLATracking" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "priority" "SupportTicketPriority" NOT NULL,
    "firstResponseDeadline" TIMESTAMP(3) NOT NULL,
    "resolutionDeadline" TIMESTAMP(3) NOT NULL,
    "status" "SupportSLAStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSLATracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRequirement" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RequirementType" NOT NULL,
    "contractId" TEXT,
    "validityMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformContract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRequirementSubmission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "documentKey" TEXT,
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRequirementSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantContractSignature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signatureHash" TEXT,

    CONSTRAINT "TenantContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bom" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "estimatedCost" DECIMAL(12,2) DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomItem" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "unit" TEXT DEFAULT 'Adet',
    "wastePercentage" DECIMAL(5,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bomId" TEXT,
    "branch" TEXT NOT NULL DEFAULT 'Merkez',
    "status" "ManufacturingOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedQuantity" INTEGER NOT NULL DEFAULT 1,
    "producedQuantity" INTEGER NOT NULL DEFAULT 0,
    "wasteQuantity" INTEGER NOT NULL DEFAULT 0,
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "totalEstimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalActualCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingOrderItem" (
    "id" TEXT NOT NULL,
    "manufacturingOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "plannedQuantity" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "actualConsumed" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isWaste" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offer_offerNumber_key" ON "Offer"("offerNumber");

-- CreateIndex
CREATE INDEX "Offer_companyId_idx" ON "Offer"("companyId");

-- CreateIndex
CREATE INDEX "Offer_customerId_idx" ON "Offer"("customerId");

-- CreateIndex
CREATE INDEX "Offer_offerNumber_idx" ON "Offer"("offerNumber");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Offer_parentOfferId_idx" ON "Offer"("parentOfferId");

-- CreateIndex
CREATE INDEX "OfferLine_offerId_idx" ON "OfferLine"("offerId");

-- CreateIndex
CREATE INDEX "OfferLine_productId_idx" ON "OfferLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferTerm_offerId_key" ON "OfferTerm"("offerId");

-- CreateIndex
CREATE INDEX "OfferStatusHistory_offerId_idx" ON "OfferStatusHistory"("offerId");

-- CreateIndex
CREATE INDEX "OfferActivity_offerId_idx" ON "OfferActivity"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticle_slug_key" ON "HelpArticle"("slug");

-- CreateIndex
CREATE INDEX "HelpArticle_tenantId_idx" ON "HelpArticle"("tenantId");

-- CreateIndex
CREATE INDEX "HelpArticle_categoryId_idx" ON "HelpArticle"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpTag_name_key" ON "HelpTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HelpTag_slug_key" ON "HelpTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HelpSearchIndex_articleId_key" ON "HelpSearchIndex"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkTradeRiskScore_dedupeKey_key" ON "NetworkTradeRiskScore"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskScore_buyerTenantId_sellerTenantId_status_idx" ON "NetworkTradeRiskScore"("buyerTenantId", "sellerTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskScore_orderId_status_idx" ON "NetworkTradeRiskScore"("orderId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskScore_escrowHoldId_status_idx" ON "NetworkTradeRiskScore"("escrowHoldId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskScore_riskTier_status_idx" ON "NetworkTradeRiskScore"("riskTier", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskScore_calculationVersion_isStale_idx" ON "NetworkTradeRiskScore"("calculationVersion", "isStale");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkTradeRiskSignal_dedupeKey_key" ON "NetworkTradeRiskSignal"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskSignal_buyerTenantId_sellerTenantId_status_idx" ON "NetworkTradeRiskSignal"("buyerTenantId", "sellerTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeRiskSignal_signalType_status_createdAt_idx" ON "NetworkTradeRiskSignal"("signalType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkEscrowPolicyDecision_escrowHoldId_decisionType_idx" ON "NetworkEscrowPolicyDecision"("escrowHoldId", "decisionType");

-- CreateIndex
CREATE INDEX "NetworkEscrowPolicyDecision_decisionType_createdAt_idx" ON "NetworkEscrowPolicyDecision"("decisionType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkPaymentReliabilitySnapshot_dedupeKey_key" ON "NetworkPaymentReliabilitySnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkPaymentReliabilitySnapshot_tenantId_paymentReliabili_idx" ON "NetworkPaymentReliabilitySnapshot"("tenantId", "paymentReliabilityScore", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemJob_idempotencyKey_key" ON "SystemJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SystemJob_queueName_status_scheduledFor_idx" ON "SystemJob"("queueName", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "SystemJob_jobType_status_createdAt_idx" ON "SystemJob"("jobType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SystemJob_tenantId_moduleScope_status_idx" ON "SystemJob"("tenantId", "moduleScope", "status");

-- CreateIndex
CREATE INDEX "SystemJob_status_priority_scheduledFor_idx" ON "SystemJob"("status", "priority", "scheduledFor");

-- CreateIndex
CREATE INDEX "SystemJob_lockedByWorker_lockExpiresAt_idx" ON "SystemJob"("lockedByWorker", "lockExpiresAt");

-- CreateIndex
CREATE INDEX "SystemJobExecutionLog_systemJobId_attemptNo_idx" ON "SystemJobExecutionLog"("systemJobId", "attemptNo");

-- CreateIndex
CREATE INDEX "SystemDeadLetterJob_originalJobId_idx" ON "SystemDeadLetterJob"("originalJobId");

-- CreateIndex
CREATE INDEX "SystemDeadLetterJob_queueName_jobType_idx" ON "SystemDeadLetterJob"("queueName", "jobType");

-- CreateIndex
CREATE UNIQUE INDEX "SystemWorkerHeartbeat_workerName_key" ON "SystemWorkerHeartbeat"("workerName");

-- CreateIndex
CREATE INDEX "SystemWorkerHeartbeat_workerName_lastHeartbeatAt_idx" ON "SystemWorkerHeartbeat"("workerName", "lastHeartbeatAt");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkLiquidityOpportunity_dedupeKey_key" ON "NetworkLiquidityOpportunity"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkLiquidityOpportunity_categoryId_regionCode_idx" ON "NetworkLiquidityOpportunity"("categoryId", "regionCode");

-- CreateIndex
CREATE INDEX "NetworkLiquidityOpportunity_status_expiresAt_idx" ON "NetworkLiquidityOpportunity"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "NetworkLiquidityOpportunity_supplyTenantId_idx" ON "NetworkLiquidityOpportunity"("supplyTenantId");

-- CreateIndex
CREATE INDEX "NetworkLiquidityOpportunity_demandTenantId_idx" ON "NetworkLiquidityOpportunity"("demandTenantId");

-- CreateIndex
CREATE INDEX "NetworkLiquidityOpportunity_matchScore_idx" ON "NetworkLiquidityOpportunity"("matchScore");

-- CreateIndex
CREATE INDEX "NetworkLiquidityMatch_buyerTenantId_idx" ON "NetworkLiquidityMatch"("buyerTenantId");

-- CreateIndex
CREATE INDEX "NetworkLiquidityMatch_sellerTenantId_idx" ON "NetworkLiquidityMatch"("sellerTenantId");

-- CreateIndex
CREATE INDEX "NetworkLiquidityMatch_opportunityId_idx" ON "NetworkLiquidityMatch"("opportunityId");

-- CreateIndex
CREATE INDEX "NetworkLiquidityMatch_status_idx" ON "NetworkLiquidityMatch"("status");

-- CreateIndex
CREATE INDEX "NetworkLiquiditySnapshot_categoryId_regionCode_idx" ON "NetworkLiquiditySnapshot"("categoryId", "regionCode");

-- CreateIndex
CREATE INDEX "NetworkLiquiditySnapshot_expiresAt_idx" ON "NetworkLiquiditySnapshot"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkTradeProposal_dedupeKey_key" ON "NetworkTradeProposal"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkTradeProposal_buyerTenantId_status_idx" ON "NetworkTradeProposal"("buyerTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeProposal_sellerTenantId_status_idx" ON "NetworkTradeProposal"("sellerTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkTradeProposal_opportunityId_idx" ON "NetworkTradeProposal"("opportunityId");

-- CreateIndex
CREATE INDEX "NetworkTradeProposal_liquidityMatchId_idx" ON "NetworkTradeProposal"("liquidityMatchId");

-- CreateIndex
CREATE INDEX "NetworkTradeProposal_status_expiresAt_idx" ON "NetworkTradeProposal"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "NetworkTradeProposalMessage_proposalId_idx" ON "NetworkTradeProposalMessage"("proposalId");

-- CreateIndex
CREATE INDEX "NetworkTradeProposalMessage_senderTenantId_idx" ON "NetworkTradeProposalMessage"("senderTenantId");

-- CreateIndex
CREATE INDEX "NetworkTradeProposalDecision_proposalId_idx" ON "NetworkTradeProposalDecision"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkPriceSignal_dedupeKey_key" ON "NetworkPriceSignal"("dedupeKey");

-- CreateIndex
CREATE INDEX "NetworkPriceSignal_categoryId_regionCode_idx" ON "NetworkPriceSignal"("categoryId", "regionCode");

-- CreateIndex
CREATE INDEX "NetworkPriceSignal_expiresAt_idx" ON "NetworkPriceSignal"("expiresAt");

-- CreateIndex
CREATE INDEX "NetworkSupplierCapacity_tenantId_categoryId_idx" ON "NetworkSupplierCapacity"("tenantId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkDiscoveryProfile_tenantId_key" ON "NetworkDiscoveryProfile"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkDiscoveryProfile_tenantId_idx" ON "NetworkDiscoveryProfile"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkTradeAbuseSignal_tenantId_signalType_idx" ON "NetworkTradeAbuseSignal"("tenantId", "signalType");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkComplianceProfile_tenantId_key" ON "NetworkComplianceProfile"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkComplianceProfile_tenantId_idx" ON "NetworkComplianceProfile"("tenantId");

-- CreateIndex
CREATE INDEX "TenantProductMapping_tenantId_idx" ON "TenantProductMapping"("tenantId");

-- CreateIndex
CREATE INDEX "TenantProductMapping_productId_idx" ON "TenantProductMapping"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIdentity_tenantId_key" ON "CompanyIdentity"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTrustProfile_tenantId_key" ON "CompanyTrustProfile"("tenantId");

-- CreateIndex
CREATE INDEX "DemandSignal_tenantId_idx" ON "DemandSignal"("tenantId");

-- CreateIndex
CREATE INDEX "DemandSignal_status_idx" ON "DemandSignal"("status");

-- CreateIndex
CREATE INDEX "DemandSignal_canonicalProductId_idx" ON "DemandSignal"("canonicalProductId");

-- CreateIndex
CREATE INDEX "TradeLedgerEntry_buyerTenantId_idx" ON "TradeLedgerEntry"("buyerTenantId");

-- CreateIndex
CREATE INDEX "TradeLedgerEntry_sellerTenantId_idx" ON "TradeLedgerEntry"("sellerTenantId");

-- CreateIndex
CREATE INDEX "TradeLedgerEntry_eventType_idx" ON "TradeLedgerEntry"("eventType");

-- CreateIndex
CREATE INDEX "TradeLedgerEntry_occurredAt_idx" ON "TradeLedgerEntry"("occurredAt");

-- CreateIndex
CREATE INDEX "TradeLedgerLink_ledgerEntryId_idx" ON "TradeLedgerLink"("ledgerEntryId");

-- CreateIndex
CREATE INDEX "TradeLedgerLink_linkedEntityType_linkedEntityId_idx" ON "TradeLedgerLink"("linkedEntityType", "linkedEntityId");

-- CreateIndex
CREATE INDEX "NetworkGrowthTrigger_tenantId_status_idx" ON "NetworkGrowthTrigger"("tenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkGrowthTrigger_canonicalProductId_idx" ON "NetworkGrowthTrigger"("canonicalProductId");

-- CreateIndex
CREATE INDEX "NetworkGrowthTrigger_triggerType_idx" ON "NetworkGrowthTrigger"("triggerType");

-- CreateIndex
CREATE INDEX "NetworkGrowthAction_triggerId_idx" ON "NetworkGrowthAction"("triggerId");

-- CreateIndex
CREATE INDEX "NetworkGrowthAction_status_idx" ON "NetworkGrowthAction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDocument_documentNo_key" ON "PlatformDocument"("documentNo");

-- CreateIndex
CREATE INDEX "TenantDocumentApproval_tenantId_idx" ON "TenantDocumentApproval"("tenantId");

-- CreateIndex
CREATE INDEX "TenantDocumentApproval_documentId_idx" ON "TenantDocumentApproval"("documentId");

-- CreateIndex
CREATE INDEX "TenantDocumentApproval_approvedByUserId_idx" ON "TenantDocumentApproval"("approvedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDocumentApproval_tenantId_documentId_documentVersion_key" ON "TenantDocumentApproval"("tenantId", "documentId", "documentVersion");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGateway_provider_key" ON "PaymentGateway"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCredit_tenantId_key" ON "TenantCredit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOnboardingProgress_tenantId_key" ON "ProductOnboardingProgress"("tenantId");

-- CreateIndex
CREATE INDEX "ProductOnboardingProgress_tenantId_idx" ON "ProductOnboardingProgress"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_actionKey_key" ON "OnboardingStep"("actionKey");

-- CreateIndex
CREATE INDEX "PlatformDiagnosticEvent_tenantId_status_idx" ON "PlatformDiagnosticEvent"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PlatformDiagnosticEvent_component_status_idx" ON "PlatformDiagnosticEvent"("component", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_createdByUserId_idx" ON "SupportTicket"("createdByUserId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToUserId_idx" ON "SupportTicket"("assignedToUserId");

-- CreateIndex
CREATE INDEX "SupportTicketComment_ticketId_idx" ON "SupportTicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketComment_userId_idx" ON "SupportTicketComment"("userId");

-- CreateIndex
CREATE INDEX "SupportTicketAttachment_ticketId_idx" ON "SupportTicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "HelpConversation_tenantId_idx" ON "HelpConversation"("tenantId");

-- CreateIndex
CREATE INDEX "HelpConversation_userId_idx" ON "HelpConversation"("userId");

-- CreateIndex
CREATE INDEX "HelpConversationMessage_conversationId_idx" ON "HelpConversationMessage"("conversationId");

-- CreateIndex
CREATE INDEX "HelpRecommendation_conversationId_idx" ON "HelpRecommendation"("conversationId");

-- CreateIndex
CREATE INDEX "HelpRecommendation_articleId_idx" ON "HelpRecommendation"("articleId");

-- CreateIndex
CREATE INDEX "PlatformHealthCheck_service_idx" ON "PlatformHealthCheck"("service");

-- CreateIndex
CREATE INDEX "PlatformHealthCheck_status_idx" ON "PlatformHealthCheck"("status");

-- CreateIndex
CREATE INDEX "PlatformIncident_tenantId_idx" ON "PlatformIncident"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformIncident_type_idx" ON "PlatformIncident"("type");

-- CreateIndex
CREATE INDEX "PlatformIncident_status_idx" ON "PlatformIncident"("status");

-- CreateIndex
CREATE INDEX "PlatformRunbook_incidentType_idx" ON "PlatformRunbook"("incidentType");

-- CreateIndex
CREATE INDEX "RunbookAction_runbookId_idx" ON "RunbookAction"("runbookId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicketTag_tenantId_slug_key" ON "SupportTicketTag"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicketTagMap_ticketId_tagId_key" ON "SupportTicketTagMap"("ticketId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportSLA_tenantId_priority_key" ON "SupportSLA"("tenantId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SupportSLATracking_ticketId_key" ON "SupportSLATracking"("ticketId");

-- CreateIndex
CREATE INDEX "PlatformRequirement_moduleId_idx" ON "PlatformRequirement"("moduleId");

-- CreateIndex
CREATE INDEX "PlatformRequirement_type_idx" ON "PlatformRequirement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformContract_slug_key" ON "PlatformContract"("slug");

-- CreateIndex
CREATE INDEX "TenantRequirementSubmission_tenantId_idx" ON "TenantRequirementSubmission"("tenantId");

-- CreateIndex
CREATE INDEX "TenantRequirementSubmission_userId_idx" ON "TenantRequirementSubmission"("userId");

-- CreateIndex
CREATE INDEX "TenantRequirementSubmission_status_idx" ON "TenantRequirementSubmission"("status");

-- CreateIndex
CREATE INDEX "TenantRequirementSubmission_expiresAt_idx" ON "TenantRequirementSubmission"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRequirementSubmission_tenantId_requirementId_key" ON "TenantRequirementSubmission"("tenantId", "requirementId");

-- CreateIndex
CREATE INDEX "TenantContractSignature_tenantId_idx" ON "TenantContractSignature"("tenantId");

-- CreateIndex
CREATE INDEX "TenantContractSignature_userId_idx" ON "TenantContractSignature"("userId");

-- CreateIndex
CREATE INDEX "TenantContractSignature_contractId_idx" ON "TenantContractSignature"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantContractSignature_tenantId_userId_contractId_version_key" ON "TenantContractSignature"("tenantId", "userId", "contractId", "version");

-- CreateIndex
CREATE INDEX "Bom_companyId_idx" ON "Bom"("companyId");

-- CreateIndex
CREATE INDEX "Bom_tenantId_idx" ON "Bom"("tenantId");

-- CreateIndex
CREATE INDEX "Bom_productId_idx" ON "Bom"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Bom_companyId_code_key" ON "Bom"("companyId", "code");

-- CreateIndex
CREATE INDEX "BomItem_bomId_idx" ON "BomItem"("bomId");

-- CreateIndex
CREATE INDEX "BomItem_productId_idx" ON "BomItem"("productId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_companyId_idx" ON "ManufacturingOrder"("companyId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_tenantId_idx" ON "ManufacturingOrder"("tenantId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_status_idx" ON "ManufacturingOrder"("status");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_productId_idx" ON "ManufacturingOrder"("productId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_bomId_idx" ON "ManufacturingOrder"("bomId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_branch_idx" ON "ManufacturingOrder"("branch");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingOrder_companyId_orderNumber_key" ON "ManufacturingOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE INDEX "ManufacturingOrderItem_manufacturingOrderId_idx" ON "ManufacturingOrderItem"("manufacturingOrderId");

-- CreateIndex
CREATE INDEX "ManufacturingOrderItem_productId_idx" ON "ManufacturingOrderItem"("productId");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- CreateIndex
CREATE INDEX "HelpCategory_tenantId_idx" ON "HelpCategory"("tenantId");

-- CreateIndex
CREATE INDEX "SellerOffer_status_idx" ON "SellerOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_b2bCustomDomain_key" ON "Tenant"("b2bCustomDomain");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLine" ADD CONSTRAINT "OfferLine_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLine" ADD CONSTRAINT "OfferLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTerm" ADD CONSTRAINT "OfferTerm_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferStatusHistory" ADD CONSTRAINT "OfferStatusHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferActivity" ADD CONSTRAINT "OfferActivity_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpArticle" ADD CONSTRAINT "HelpArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpSearchIndex" ADD CONSTRAINT "HelpSearchIndex_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "HelpArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemJobExecutionLog" ADD CONSTRAINT "SystemJobExecutionLog_systemJobId_fkey" FOREIGN KEY ("systemJobId") REFERENCES "SystemJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLiquidityMatch" ADD CONSTRAINT "NetworkLiquidityMatch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "NetworkLiquidityOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkTradeProposalMessage" ADD CONSTRAINT "NetworkTradeProposalMessage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "NetworkTradeProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkTradeProposalDecision" ADD CONSTRAINT "NetworkTradeProposalDecision_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "NetworkTradeProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTaxonomyNode" ADD CONSTRAINT "ProductTaxonomyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductTaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalProduct" ADD CONSTRAINT "CanonicalProduct_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "ProductTaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantProductMapping" ADD CONSTRAINT "TenantProductMapping_canonicalProductId_fkey" FOREIGN KEY ("canonicalProductId") REFERENCES "CanonicalProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCluster" ADD CONSTRAINT "ProductCluster_canonicalProductId_fkey" FOREIGN KEY ("canonicalProductId") REFERENCES "CanonicalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ProductCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_canonicalProductId_fkey" FOREIGN KEY ("canonicalProductId") REFERENCES "CanonicalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyVerificationDocument" ADD CONSTRAINT "CompanyVerificationDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTrustProfile" ADD CONSTRAINT "CompanyTrustProfile_companyIdentityId_fkey" FOREIGN KEY ("companyIdentityId") REFERENCES "CompanyIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocumentApproval" ADD CONSTRAINT "TenantDocumentApproval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PlatformDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCredit" ADD CONSTRAINT "TenantCredit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetPlan" ADD CONSTRAINT "TargetPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetPeriod" ADD CONSTRAINT "TargetPeriod_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TargetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetAssignment" ADD CONSTRAINT "TargetAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TargetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetAssignment" ADD CONSTRAINT "TargetAssignment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TargetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetAssignment" ADD CONSTRAINT "TargetAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TargetAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusResult" ADD CONSTRAINT "BonusResult_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TargetAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementBadge" ADD CONSTRAINT "AchievementBadge_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardScore" ADD CONSTRAINT "LeaderboardScore_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITargetSuggestion" ADD CONSTRAINT "AITargetSuggestion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TargetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueInsight" ADD CONSTRAINT "RevenueInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesForecast" ADD CONSTRAINT "SalesForecast_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPerformanceScore" ADD CONSTRAINT "SalesPerformanceScore_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRiskAlert" ADD CONSTRAINT "SalesRiskAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesXInsight" ADD CONSTRAINT "SalesXInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesXInsight" ADD CONSTRAINT "SalesXInsight_targetStaffId_fkey" FOREIGN KEY ("targetStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesXOpportunity" ADD CONSTRAINT "SalesXOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesXOpportunity" ADD CONSTRAINT "SalesXOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveVisit" ADD CONSTRAINT "PredictiveVisit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveVisit" ADD CONSTRAINT "PredictiveVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveVisit" ADD CONSTRAINT "PredictiveVisit_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSuggestion" ADD CONSTRAINT "RouteSuggestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSuggestion" ADD CONSTRAINT "RouteSuggestion_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketComment" ADD CONSTRAINT "SupportTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketAttachment" ADD CONSTRAINT "SupportTicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpConversationMessage" ADD CONSTRAINT "HelpConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HelpConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRecommendation" ADD CONSTRAINT "HelpRecommendation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HelpConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRecommendation" ADD CONSTRAINT "HelpRecommendation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "HelpArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunbookAction" ADD CONSTRAINT "RunbookAction_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "PlatformRunbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketTagMap" ADD CONSTRAINT "SupportTicketTagMap_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketTagMap" ADD CONSTRAINT "SupportTicketTagMap_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "SupportTicketTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportSLATracking" ADD CONSTRAINT "SupportSLATracking_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRequirement" ADD CONSTRAINT "PlatformRequirement_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PlatformContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequirementSubmission" ADD CONSTRAINT "TenantRequirementSubmission_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "PlatformRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantContractSignature" ADD CONSTRAINT "TenantContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PlatformContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrderItem" ADD CONSTRAINT "ManufacturingOrderItem_manufacturingOrderId_fkey" FOREIGN KEY ("manufacturingOrderId") REFERENCES "ManufacturingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrderItem" ADD CONSTRAINT "ManufacturingOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
