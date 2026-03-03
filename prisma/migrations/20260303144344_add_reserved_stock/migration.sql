-- CreateEnum
CREATE TYPE "PayoutDestinationType" AS ENUM ('IBAN');

-- CreateEnum
CREATE TYPE "PayoutDestinationStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'PAID_INTERNAL', 'REJECTED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "SellerPaymentProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProviderPaymentStatus" AS ENUM ('INIT', 'PAID', 'FAILED', 'REFUNDED', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "ProviderPayoutStatus" AS ENUM ('QUEUED', 'SENT', 'SUCCEEDED', 'FAILED', 'REVERSED', 'RECONCILE_REQUIRED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "PayoutOutboxStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "FinanceIntegrityAlertType" AS ENUM ('LEDGER_UNBALANCED', 'FINALIZE_MISSING', 'FINALIZE_ORPHAN', 'WALLET_DRIFT', 'OUTBOX_MISSING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FinanceIntegrityAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FinanceOpsLogSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OpsHealthSnapshotScope" AS ENUM ('RUNTIME', 'DAILY');

-- CreateEnum
CREATE TYPE "TenantDailyMetricsRole" AS ENUM ('BUYER', 'SELLER', 'BOTH');

-- CreateEnum
CREATE TYPE "TenantCohort" AS ENUM ('PILOT', 'GENERAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "BoostSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BoostInvoiceCollectionStatus" AS ENUM ('CURRENT', 'GRACE', 'OVERDUE', 'COLLECTION_BLOCKED');

-- CreateEnum
CREATE TYPE "BillingLedgerRefType" AS ENUM ('BOOST_SUBSCRIPTION_CHARGE', 'BOOST_OVERAGE');

-- CreateEnum
CREATE TYPE "BoostInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEEDS_INFO', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EscrowActionState" AS ENUM ('NONE', 'HELD', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DisputeResolutionCode" AS ENUM ('DELIVERY_FAILED', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'BILLING_ERROR', 'FRAUD_SUSPECTED', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeActionType" AS ENUM ('HOLD_ESCROW', 'PARTIAL_RELEASE', 'FULL_RELEASE', 'REFUND', 'FLAG_CHARGEBACK', 'REQUEST_INFO', 'CHANGE_SEVERITY', 'CHANGE_STATUS', 'ADD_INTERNAL_NOTE');

-- CreateEnum
CREATE TYPE "DealerMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DealerPaymentProvider" AS ENUM ('IYZICO', 'ODEAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "DealerPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DealerRole" AS ENUM ('DEALER_ADMIN', 'DEALER_STAFF');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('POS', 'FIELD', 'ECOM', 'GLOBAL_B2B', 'DEALER_B2B');

-- CreateEnum
CREATE TYPE "DealerInviteStatus" AS ENUM ('ISSUED', 'REDEEMED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');

-- DropIndex
DROP INDEX "BoostRule_scope_targetId_isActive_idx";

-- AlterTable
ALTER TABLE "BoostRule" ADD COLUMN     "maxImpressionsPerDay" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DiscoveryImpression" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "LedgerAccount" ADD COLUMN     "reservedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dealerMembershipId" TEXT,
ADD COLUMN     "dealerPrice" DECIMAL(12,2),
ADD COLUMN     "reservationReleasedAt" TIMESTAMP(3),
ADD COLUMN     "salesChannel" "SalesChannel" NOT NULL DEFAULT 'POS';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DiscoveryRequestLog" (
    "id" TEXT NOT NULL,
    "viewerTenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "weightsVersion" TEXT NOT NULL,
    "filtersJson" JSONB NOT NULL,
    "sortMode" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "dbLatencyMs" INTEGER NOT NULL,
    "computeLatencyMs" INTEGER NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "topResultsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPriceSnapshot" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutDestination" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "type" "PayoutDestinationType" NOT NULL,
    "ibanMasked" TEXT NOT NULL,
    "ibanEncrypted" TEXT NOT NULL,
    "holderNameMasked" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "PayoutDestinationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "note" TEXT,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerPaymentProfile" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'IYZICO',
    "subMerchantKey" TEXT NOT NULL,
    "status" "SellerPaymentProfileStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerPaymentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'IYZICO',
    "providerPaymentId" TEXT NOT NULL,
    "networkPaymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "ProviderPaymentStatus" NOT NULL DEFAULT 'INIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPayout" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'IYZICO',
    "providerPayoutId" TEXT NOT NULL,
    "payoutRequestId" TEXT,
    "sellerEarningId" TEXT,
    "shipmentId" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "ProviderPayoutStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutOutbox" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'IYZICO',
    "idempotencyKey" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "PayoutOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'IYZICO',
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "ProviderWebhookStatus" NOT NULL DEFAULT 'RECEIVED',

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceIntegrityAlert" (
    "id" TEXT NOT NULL,
    "type" "FinanceIntegrityAlertType" NOT NULL,
    "referenceId" TEXT,
    "severity" "FinanceIntegrityAlertSeverity" NOT NULL DEFAULT 'WARNING',
    "detailsJson" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceIntegrityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceOpsLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "severity" "FinanceOpsLogSeverity" NOT NULL DEFAULT 'INFO',
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceOpsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsHealthSnapshot" (
    "id" TEXT NOT NULL,
    "scope" "OpsHealthSnapshotScope" NOT NULL DEFAULT 'RUNTIME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "OpsHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingHealthSnapshot" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "totalOutstandingAR" DECIMAL(18,2) NOT NULL,
    "overdueInvoiceCount" INTEGER NOT NULL,
    "blockedSubscriptionCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsAlertAck" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "acknowledgedByUserId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAlertAck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDailyMetrics" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "gmvGross" DECIMAL(12,2) NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "activeBuyerCount" INTEGER NOT NULL,
    "activeSellerCount" INTEGER NOT NULL,
    "takeRevenueCommission" DECIMAL(12,2) NOT NULL,
    "takeRevenueBoost" DECIMAL(12,2) NOT NULL,
    "takeRate" DECIMAL(5,4) NOT NULL,
    "escrowFloatEndOfDay" DECIMAL(12,2) NOT NULL,
    "payoutVolume" DECIMAL(12,2) NOT NULL,
    "payoutCount" INTEGER NOT NULL,
    "avgReleaseTimeHours" DECIMAL(12,2) NOT NULL,
    "chargebackAmount" DECIMAL(12,2) NOT NULL,
    "chargebackCount" INTEGER NOT NULL,
    "receivableOutstandingEndOfDay" DECIMAL(12,2) NOT NULL,
    "opsCriticalAlertCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDailyMetrics" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "TenantDailyMetricsRole" NOT NULL,
    "gmvGross" DECIMAL(12,2) NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "commissionPaid" DECIMAL(12,2) NOT NULL,
    "payoutReceived" DECIMAL(12,2) NOT NULL,
    "avgReleaseTimeHours" DECIMAL(12,2) NOT NULL,
    "disputeCount" INTEGER NOT NULL,
    "chargebackCount" INTEGER NOT NULL,
    "receivableOutstanding" DECIMAL(12,2) NOT NULL,
    "discoveryImpressions" INTEGER NOT NULL,
    "boostImpressions" INTEGER NOT NULL DEFAULT 0,
    "boostSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultValue" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFeatureFlag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantFeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRolloutPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohort" "TenantCohort" NOT NULL DEFAULT 'PILOT',
    "maxDailyGmv" DECIMAL(12,2),
    "maxDailyPayout" DECIMAL(12,2),
    "maxSingleOrderAmount" DECIMAL(12,2),
    "holdDaysOverride" INTEGER,
    "earlyReleaseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "payoutPaused" BOOLEAN NOT NULL DEFAULT false,
    "escrowPaused" BOOLEAN NOT NULL DEFAULT false,
    "boostPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRolloutPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotCohortTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotCohortTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCohortDailyMetrics" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "cohortTag" TEXT NOT NULL,
    "gmvGross" DECIMAL(12,2) NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "payoutVolume" DECIMAL(12,2) NOT NULL,
    "takeRevenueCommission" DECIMAL(12,2) NOT NULL,
    "chargebackAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCohortDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "monthlyImpressionQuota" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostSubscription" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "BoostSubscriptionStatus" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "nextRenewalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChargedPeriodKey" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "billingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostInvoice" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "BoostInvoiceStatus" NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "ledgerGroupId" TEXT,
    "graceEndsAt" TIMESTAMP(3),
    "overdueAt" TIMESTAMP(3),
    "collectionStatus" "BoostInvoiceCollectionStatus" NOT NULL DEFAULT 'CURRENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostUsageDaily" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "sponsoredImpressions" INTEGER NOT NULL DEFAULT 0,
    "billableImpressions" INTEGER NOT NULL DEFAULT 0,
    "periodKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostUsageEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "sponsoredImpressions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingLedgerRef" (
    "id" TEXT NOT NULL,
    "entityType" "BillingLedgerRefType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "ledgerGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingLedgerRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRequestBillingState" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "meteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryRequestBillingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "DisputeSeverity" NOT NULL DEFAULT 'LOW',
    "escrowActionState" "EscrowActionState" NOT NULL DEFAULT 'NONE',
    "referencedShipmentId" TEXT,
    "referencedOrderId" TEXT,
    "buyerTenantId" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "resolutionCode" "DisputeResolutionCode",

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeAction" (
    "id" TEXT NOT NULL,
    "disputeCaseId" TEXT NOT NULL,
    "actionType" "DisputeActionType" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostPolicyConfig" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "multiplierMin" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "multiplierMax" DECIMAL(5,2) NOT NULL DEFAULT 3.0,
    "sponsoredInventoryCapPct" INTEGER NOT NULL DEFAULT 20,
    "interleavePatternJson" JSONB NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 5,
    "maxRuleDurationDays" INTEGER NOT NULL DEFAULT 90,
    "cTierBoostAllowed" BOOLEAN NOT NULL DEFAULT true,
    "dTierBoostAllowed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostPolicyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostBillingHealthSnapshot" (
    "id" TEXT NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "outstandingArTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overdueCount" INTEGER NOT NULL DEFAULT 0,
    "graceCount" INTEGER NOT NULL DEFAULT 0,
    "blockedSubscriptionsCount" INTEGER NOT NULL DEFAULT 0,
    "topOverdueTenantsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostBillingHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostTenantEnforcement" (
    "tenantId" TEXT NOT NULL,
    "boostPaused" BOOLEAN NOT NULL DEFAULT false,
    "boostBanReason" TEXT,
    "quotaCapOverride" INTEGER,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostTenantEnforcement_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "DealerUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultDealerCompanyId" TEXT,

    CONSTRAINT "DealerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerOtpChallenge" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerOtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "dealerUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerCompany" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxOffice" TEXT,
    "taxNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerMembership" (
    "id" TEXT NOT NULL,
    "dealerUserId" TEXT NOT NULL,
    "dealerCompanyId" TEXT,
    "tenantId" TEXT NOT NULL,
    "status" "DealerMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "priceRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerPriceRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DealerPriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerCheckoutAttempt" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerCheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerPaymentIntent" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "dealerMembershipId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "provider" "DealerPaymentProvider",
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "referenceCode" TEXT,
    "redirectUrl" TEXT,
    "providerData" JSONB,
    "providerResult" JSONB,
    "paidAmount" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'DEALER_B2B',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerPaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerInvite" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "DealerInviteStatus" NOT NULL DEFAULT 'ISSUED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "dealerCompanyId" TEXT,
    "issuedToPhoneE164" TEXT,
    "issuedToEmail" TEXT,
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerCart" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPaymentConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "DealerPaymentProvider" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookReplay" (
    "id" TEXT NOT NULL,
    "provider" "DealerPaymentProvider" NOT NULL,
    "nonce" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookReplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryRequestLog_requestId_key" ON "DiscoveryRequestLog"("requestId");

-- CreateIndex
CREATE INDEX "DiscoveryRequestLog_viewerTenantId_createdAt_idx" ON "DiscoveryRequestLog"("viewerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPriceSnapshot_listingId_capturedAt_idx" ON "ListingPriceSnapshot"("listingId", "capturedAt");

-- CreateIndex
CREATE INDEX "PayoutDestination_sellerTenantId_isDefault_idx" ON "PayoutDestination"("sellerTenantId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutDestination_sellerTenantId_ibanMasked_key" ON "PayoutDestination"("sellerTenantId", "ibanMasked");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRequest_idempotencyKey_key" ON "PayoutRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PayoutRequest_sellerTenantId_status_requestedAt_idx" ON "PayoutRequest"("sellerTenantId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_requestedAt_idx" ON "PayoutRequest"("status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerPaymentProfile_sellerTenantId_key" ON "SellerPaymentProfile"("sellerTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPayment_providerPaymentId_key" ON "ProviderPayment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPayment_networkPaymentId_key" ON "ProviderPayment"("networkPaymentId");

-- CreateIndex
CREATE INDEX "ProviderPayment_tenantId_status_createdAt_idx" ON "ProviderPayment"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPayout_providerPayoutId_key" ON "ProviderPayout"("providerPayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPayout_idempotencyKey_key" ON "ProviderPayout"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ProviderPayout_sellerTenantId_status_createdAt_idx" ON "ProviderPayout"("sellerTenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderPayout_status_createdAt_idx" ON "ProviderPayout"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutOutbox_idempotencyKey_key" ON "PayoutOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PayoutOutbox_status_nextRetryAt_idx" ON "PayoutOutbox"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderWebhookEvent_externalEventId_key" ON "ProviderWebhookEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_provider_receivedAt_idx" ON "ProviderWebhookEvent"("provider", "receivedAt");

-- CreateIndex
CREATE INDEX "FinanceIntegrityAlert_type_createdAt_idx" ON "FinanceIntegrityAlert"("type", "createdAt");

-- CreateIndex
CREATE INDEX "OpsHealthSnapshot_scope_createdAt_idx" ON "OpsHealthSnapshot"("scope", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingHealthSnapshot_day_key" ON "BillingHealthSnapshot"("day");

-- CreateIndex
CREATE UNIQUE INDEX "OpsAlertAck_alertType_alertId_key" ON "OpsAlertAck"("alertType", "alertId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDailyMetrics_day_key" ON "PlatformDailyMetrics"("day");

-- CreateIndex
CREATE INDEX "TenantDailyMetrics_tenantId_day_idx" ON "TenantDailyMetrics"("tenantId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDailyMetrics_day_tenantId_key" ON "TenantDailyMetrics"("day", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "TenantFeatureFlag_tenantId_featureKey_idx" ON "TenantFeatureFlag"("tenantId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeatureFlag_tenantId_featureKey_key" ON "TenantFeatureFlag"("tenantId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRolloutPolicy_tenantId_key" ON "TenantRolloutPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "PilotCohortTag_tag_idx" ON "PilotCohortTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "PilotCohortTag_tenantId_tag_key" ON "PilotCohortTag"("tenantId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCohortDailyMetrics_day_cohortTag_key" ON "PlatformCohortDailyMetrics"("day", "cohortTag");

-- CreateIndex
CREATE UNIQUE INDEX "BoostPlan_code_key" ON "BoostPlan"("code");

-- CreateIndex
CREATE INDEX "BoostSubscription_sellerTenantId_status_idx" ON "BoostSubscription"("sellerTenantId", "status");

-- CreateIndex
CREATE INDEX "BoostInvoice_sellerTenantId_status_idx" ON "BoostInvoice"("sellerTenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BoostInvoice_subscriptionId_periodKey_key" ON "BoostInvoice"("subscriptionId", "periodKey");

-- CreateIndex
CREATE INDEX "BoostUsageDaily_sellerTenantId_periodKey_idx" ON "BoostUsageDaily"("sellerTenantId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "BoostUsageDaily_sellerTenantId_day_key" ON "BoostUsageDaily"("sellerTenantId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "BoostUsageEvent_requestId_sellerTenantId_key" ON "BoostUsageEvent"("requestId", "sellerTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingLedgerRef_idempotencyKey_key" ON "BillingLedgerRef"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryRequestBillingState_requestId_key" ON "DiscoveryRequestBillingState"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeCase_ticketId_key" ON "DisputeCase"("ticketId");

-- CreateIndex
CREATE INDEX "DisputeCase_status_idx" ON "DisputeCase"("status");

-- CreateIndex
CREATE INDEX "DisputeCase_severity_idx" ON "DisputeCase"("severity");

-- CreateIndex
CREATE INDEX "DisputeCase_updatedAt_idx" ON "DisputeCase"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeAction_idempotencyKey_key" ON "DisputeAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DisputeAction_disputeCaseId_idx" ON "DisputeAction"("disputeCaseId");

-- CreateIndex
CREATE INDEX "DisputeAction_actionType_idx" ON "DisputeAction"("actionType");

-- CreateIndex
CREATE INDEX "DisputeAction_createdAt_idx" ON "DisputeAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BoostBillingHealthSnapshot_asOfDate_key" ON "BoostBillingHealthSnapshot"("asOfDate");

-- CreateIndex
CREATE INDEX "BoostBillingHealthSnapshot_asOfDate_idx" ON "BoostBillingHealthSnapshot"("asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "DealerUser_email_key" ON "DealerUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOtpChallenge_phoneE164_key" ON "DealerOtpChallenge"("phoneE164");

-- CreateIndex
CREATE INDEX "DealerOtpChallenge_phoneE164_idx" ON "DealerOtpChallenge"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "DealerSession_tokenHash_key" ON "DealerSession"("tokenHash");

-- CreateIndex
CREATE INDEX "DealerSession_dealerUserId_idx" ON "DealerSession"("dealerUserId");

-- CreateIndex
CREATE INDEX "DealerMembership_tenantId_idx" ON "DealerMembership"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerMembership_dealerUserId_tenantId_key" ON "DealerMembership"("dealerUserId", "tenantId");

-- CreateIndex
CREATE INDEX "DealerPriceRule_tenantId_isActive_idx" ON "DealerPriceRule"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DealerCheckoutAttempt_membershipId_idempotencyKey_key" ON "DealerCheckoutAttempt"("membershipId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DealerPaymentIntent_idempotencyKey_key" ON "DealerPaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DealerPaymentIntent_provider_referenceCode_idx" ON "DealerPaymentIntent"("provider", "referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "DealerInvite_tokenHash_key" ON "DealerInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "DealerInvite_supplierTenantId_status_idx" ON "DealerInvite"("supplierTenantId", "status");

-- CreateIndex
CREATE INDEX "DealerInvite_expiresAt_idx" ON "DealerInvite"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_key_createdAt_idx" ON "RateLimitEvent"("key", "createdAt");

-- CreateIndex
CREATE INDEX "DealerCart_membershipId_status_idx" ON "DealerCart"("membershipId", "status");

-- CreateIndex
CREATE INDEX "DealerCart_supplierTenantId_idx" ON "DealerCart"("supplierTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerCartItem_cartId_productId_key" ON "DealerCartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPaymentConfig_tenantId_key" ON "TenantPaymentConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPaymentConfig_tenantId_provider_idx" ON "TenantPaymentConfig"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "WebhookReplay_provider_seenAt_idx" ON "WebhookReplay"("provider", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookReplay_provider_nonce_key" ON "WebhookReplay"("provider", "nonce");

-- CreateIndex
CREATE INDEX "BoostRule_scope_targetId_isActive_startsAt_endsAt_idx" ON "BoostRule"("scope", "targetId", "isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BoostRule_isActive_endsAt_idx" ON "BoostRule"("isActive", "endsAt");

-- CreateIndex
CREATE INDEX "DiscoveryImpression_requestId_idx" ON "DiscoveryImpression"("requestId");

-- CreateIndex
CREATE INDEX "NetworkListing_visibility_status_idx" ON "NetworkListing"("visibility", "status");

-- CreateIndex
CREATE INDEX "Product_reservedStock_idx" ON "Product"("reservedStock");

-- CreateIndex
CREATE INDEX "SellerTrustScore_sellerTenantId_idx" ON "SellerTrustScore"("sellerTenantId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dealerMembershipId_fkey" FOREIGN KEY ("dealerMembershipId") REFERENCES "DealerMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutDestination" ADD CONSTRAINT "PayoutDestination_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerPaymentProfile" ADD CONSTRAINT "SellerPaymentProfile_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayment" ADD CONSTRAINT "ProviderPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutOutbox" ADD CONSTRAINT "PayoutOutbox_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostSubscription" ADD CONSTRAINT "BoostSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BoostPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostInvoice" ADD CONSTRAINT "BoostInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BoostSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAction" ADD CONSTRAINT "DisputeAction_disputeCaseId_fkey" FOREIGN KEY ("disputeCaseId") REFERENCES "DisputeCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerSession" ADD CONSTRAINT "DealerSession_dealerUserId_fkey" FOREIGN KEY ("dealerUserId") REFERENCES "DealerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMembership" ADD CONSTRAINT "DealerMembership_dealerUserId_fkey" FOREIGN KEY ("dealerUserId") REFERENCES "DealerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMembership" ADD CONSTRAINT "DealerMembership_dealerCompanyId_fkey" FOREIGN KEY ("dealerCompanyId") REFERENCES "DealerCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMembership" ADD CONSTRAINT "DealerMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMembership" ADD CONSTRAINT "DealerMembership_priceRuleId_fkey" FOREIGN KEY ("priceRuleId") REFERENCES "DealerPriceRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPriceRule" ADD CONSTRAINT "DealerPriceRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerCheckoutAttempt" ADD CONSTRAINT "DealerCheckoutAttempt_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "DealerMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerInvite" ADD CONSTRAINT "DealerInvite_supplierTenantId_fkey" FOREIGN KEY ("supplierTenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerInvite" ADD CONSTRAINT "DealerInvite_dealerCompanyId_fkey" FOREIGN KEY ("dealerCompanyId") REFERENCES "DealerCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerCart" ADD CONSTRAINT "DealerCart_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "DealerMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerCartItem" ADD CONSTRAINT "DealerCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "DealerCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerCartItem" ADD CONSTRAINT "DealerCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
