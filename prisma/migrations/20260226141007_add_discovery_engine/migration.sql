/*
  Warnings:

  - The values [P1_URGENT,P2_HIGH,P3_NORMAL,P4_LOW] on the enum `TicketPriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [NEW,WAITING_CUSTOMER,CLOSED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignedToUserId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `metadataJson` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `relatedHelpTopicId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `requesterUserId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `TicketMessage` table. All the data in the column will be lost.
  - You are about to drop the column `authorType` on the `TicketMessage` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `TicketMessage` table. All the data in the column will be lost.
  - You are about to drop the column `isInternal` on the `TicketMessage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TicketMessage` table. All the data in the column will be lost.
  - You are about to drop the `TicketAttachment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `StockMovement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `taxNumber` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `TicketMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redactedMessage` to the `TicketMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderRole` to the `TicketMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderTenantId` to the `TicketMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ODEL', 'IYZICO');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('DIRECT', 'ESCROW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ShipmentMode" AS ENUM ('MANUAL', 'INTEGRATED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ShipmentInboxStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'SELECT');

-- CreateEnum
CREATE TYPE "MappingConfidence" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('LIST', 'INCREASE_VISIBILITY', 'ADJUST_PRICE', 'PAUSE', 'FIX_LISTING', 'SET_PRICE');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DISMISSED', 'AUTO_APPLIED', 'PREVIEW_ONLY');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('NETWORK', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('ADMIN', 'SELLER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommerceAction" AS ENUM ('CREATE_LISTING', 'ACTIVATE_LISTING', 'PAUSE_LISTING', 'MAP_CATEGORY', 'AUTO_PUBLISH', 'AUTO_PAUSE', 'POLICY_UPDATE', 'SUGGESTION_ACCEPT', 'SUGGESTION_DISMISS', 'AUTO_PUBLISH_ERROR');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SENT', 'RESPONDED', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SettlementCycle" AS ENUM ('INSTANT', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OrderSourceType" AS ENUM ('CART', 'RFQ', 'CONTRACT');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BUYER', 'SELLER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommissionRuleScope" AS ENUM ('GLOBAL', 'COMPANY_OVERRIDE');

-- CreateEnum
CREATE TYPE "CommissionRuleMatchType" AS ENUM ('CATEGORY', 'BRAND', 'CATEGORY_AND_BRAND', 'DEFAULT');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'CLEARED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('SHIPPING_DISPUTE', 'EARNING_DISPUTE', 'RELEASE_REQUEST', 'GENERAL');

-- CreateEnum
CREATE TYPE "TicketRelatedEntityType" AS ENUM ('SHIPPING_LINE', 'EARNING', 'ORDER');

-- CreateEnum
CREATE TYPE "TicketSenderRole" AS ENUM ('BUYER', 'SELLER', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "TicketAuditAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'SLA_UPDATED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SellerRiskTier" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "TrustEventType" AS ENUM ('SHIPMENT_DELIVERED_ON_TIME', 'SHIPMENT_DELIVERED_LATE', 'SHIPPING_DISPUTE_OPENED', 'SHIPPING_DISPUTE_RESOLVED', 'SLA_BREACH', 'CHARGEBACK_POSTED', 'RECEIVABLE_CREATED', 'EARNING_MANUAL_OVERRIDE', 'EARNING_RELEASED');

-- CreateEnum
CREATE TYPE "RecalcJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecalcReason" AS ENUM ('SCHEDULED', 'EVENT_DRIVEN', 'MANUAL_ADMIN');

-- CreateEnum
CREATE TYPE "BoostScope" AS ENUM ('LISTING', 'SELLER', 'CATEGORY');

-- AlterEnum
BEGIN;
CREATE TYPE "TicketPriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
ALTER TABLE "Ticket" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "priority" TYPE "TicketPriority_new" USING ("priority"::text::"TicketPriority_new");
ALTER TYPE "TicketPriority" RENAME TO "TicketPriority_old";
ALTER TYPE "TicketPriority_new" RENAME TO "TicketPriority";
DROP TYPE "TicketPriority_old";
ALTER TABLE "Ticket" ALTER COLUMN "priority" SET DEFAULT 'LOW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'SLA_BREACH');
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_relatedHelpTopicId_fkey";

-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_ticketId_fkey";

-- DropIndex
DROP INDEX "Ticket_ticketNumber_key";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "taxNumber" TEXT NOT NULL,
ADD COLUMN     "type" "CompanyType" NOT NULL DEFAULT 'BUYER';

-- AlterTable
ALTER TABLE "PdksDisplay" ADD COLUMN     "announcement" TEXT;

-- AlterTable
ALTER TABLE "SecurityEvent" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "hasSaleInLast5Min" DROP DEFAULT,
ALTER COLUMN "branch" DROP NOT NULL,
ALTER COLUMN "staff" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "assignedToUserId",
DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "metadataJson",
DROP COLUMN "relatedHelpTopicId",
DROP COLUMN "requesterUserId",
DROP COLUMN "subject",
DROP COLUMN "tags",
DROP COLUMN "ticketNumber",
DROP COLUMN "updatedAt",
ADD COLUMN     "counterpartyTenantId" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "relatedEntityType" "TicketRelatedEntityType",
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "slaDueAt" TIMESTAMP(3),
ADD COLUMN     "type" "TicketType" NOT NULL DEFAULT 'GENERAL',
ALTER COLUMN "priority" SET DEFAULT 'LOW',
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "TicketMessage" DROP COLUMN "authorId",
DROP COLUMN "authorType",
DROP COLUMN "body",
DROP COLUMN "isInternal",
DROP COLUMN "updatedAt",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "redactedMessage" TEXT NOT NULL,
ADD COLUMN     "senderRole" "TicketSenderRole" NOT NULL,
ADD COLUMN     "senderTenantId" TEXT NOT NULL;

-- DropTable
DROP TABLE "TicketAttachment";

-- DropEnum
DROP TYPE "AuthorType";

-- DropEnum
DROP TYPE "TicketCategory";

-- CreateTable
CREATE TABLE "NetworkPayment" (
    "id" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "providerPaymentId" TEXT,
    "providerPaymentKey" TEXT,
    "attemptKey" TEXT,
    "checkoutUrl" TEXT,
    "rawInit" JSONB,
    "payoutStatus" TEXT NOT NULL DEFAULT 'INITIATED',
    "releasedAt" TIMESTAMP(3),
    "releaseAttemptKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEventInbox" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "networkPaymentId" TEXT,
    "raw" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "PaymentEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,

    CONSTRAINT "PaymentEventInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkOrder" (
    "id" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(12,2) NOT NULL,
    "shippingAmount" DECIMAL(12,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionKey" TEXT,
    "disputeOpenedAt" TIMESTAMP(3),
    "itemsHash" TEXT NOT NULL,
    "items" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkOrderItem" (
    "id" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "listingId" TEXT,
    "globalProductId" TEXT NOT NULL,
    "erpProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "qty" INTEGER NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "isContractPriced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerBalanceLedger" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "type" "LedgerType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerBalanceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCommissionLedger" (
    "id" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutEventInbox" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "status" "PaymentEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PayoutEventInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "mode" "ShipmentMode" NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "carrierCode" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "normalizedTracking" TEXT,
    "labelUrl" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "initKey" TEXT,
    "deliveryNoteUuid" TEXT,
    "deliveryNoteStatus" TEXT,
    "items" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEventInbox" (
    "id" TEXT NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "carrierEventId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "shipmentId" TEXT,
    "raw" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "ShipmentInboxStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,

    CONSTRAINT "ShipmentEventInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GlobalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL DEFAULT 'STRING',

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeOption" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERPProductCategory" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ERPProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMapping" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "erpCategoryId" TEXT NOT NULL,
    "globalCategoryId" TEXT NOT NULL,
    "confidence" "MappingConfidence" NOT NULL DEFAULT 'MANUAL',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BListingCategoryOverride" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "globalCategoryId" TEXT NOT NULL,

    CONSTRAINT "B2BListingCategoryOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BSuggestion" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "suggestionType" "SuggestionType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasonsJson" JSONB NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "dedupeKey" TEXT,
    "dismissedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2BSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationDecisionLog" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "variantId" TEXT,
    "rule" TEXT NOT NULL,
    "checksJson" JSONB NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerAutomationPolicy" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "understockThresholdDays" INTEGER NOT NULL DEFAULT 7,
    "minOnHandThreshold" INTEGER NOT NULL DEFAULT 100,
    "lowSalesThreshold" INTEGER NOT NULL DEFAULT 3,
    "maxReservedRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "minMarginPercent" DOUBLE PRECISION,
    "minListingQualityScore" INTEGER NOT NULL DEFAULT 50,
    "defaultVisibility" "Visibility" NOT NULL DEFAULT 'NETWORK',
    "defaultMinOrderQty" INTEGER NOT NULL DEFAULT 1,
    "defaultLeadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "allowAutoPriceAdjust" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SellerAutomationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceAuditLog" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "action" "CommerceAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommerceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkListing" (
    "id" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "erpProductId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "Visibility" NOT NULL DEFAULT 'NETWORK',
    "packSize" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProductMap" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "erpProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProductMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "targetPrice" DECIMAL(12,2),

    CONSTRAINT "RfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerOffer" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerOfferItem" (
    "id" TEXT NOT NULL,
    "sellerOfferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SellerOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'DIRECT',
    "settlementCycle" "SettlementCycle" NOT NULL DEFAULT 'INSTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "baseUnitPrice" DECIMAL(12,2) NOT NULL,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTier" (
    "id" TEXT NOT NULL,
    "contractItemId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ContractTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedStock" (
    "id" TEXT NOT NULL,
    "contractItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "allocated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReservedStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSLA" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "maxDeliveryDays" INTEGER NOT NULL,
    "latePenaltyPercent" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ContractSLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringOrder" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL,
    "dayOfPeriod" INTEGER NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenaltyLedger" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenaltyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductConsumption" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuySuggestion" (
    "id" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "daysRemaining" DOUBLE PRECISION NOT NULL,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "roundingMode" TEXT NOT NULL DEFAULT 'HALF_UP',
    "precision" INTEGER NOT NULL DEFAULT 2,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CommissionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "scope" "CommissionRuleScope" NOT NULL DEFAULT 'GLOBAL',
    "matchType" "CommissionRuleMatchType" NOT NULL DEFAULT 'DEFAULT',
    "category" TEXT,
    "brand" TEXT,
    "ratePercentage" DECIMAL(5,2) NOT NULL,
    "fixedFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "networkOrderId" TEXT NOT NULL,
    "planId" TEXT,
    "appliedRate" DECIMAL(5,2) NOT NULL,
    "appliedFixedFee" DECIMAL(12,2) NOT NULL,
    "totalCommission" DECIMAL(12,2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerEarning" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "chargebackAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "expectedClearDate" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "SellerEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseWindowPolicy" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "isActiveDefault" BOOLEAN NOT NULL DEFAULT true,
    "defaultHoldDays" INTEGER NOT NULL DEFAULT 14,
    "allowEarlyRelease" BOOLEAN NOT NULL DEFAULT false,
    "earlyReleaseFeeRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ReleaseWindowPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "lastReconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerGroup" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "refType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "resultHash" TEXT,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInvoice" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "rawRef" TEXT,
    "parsedJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PARSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInvoiceLine" (
    "id" TEXT NOT NULL,
    "shippingInvoiceId" TEXT NOT NULL,
    "trackingNo" TEXT NOT NULL,
    "chargeAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2),
    "serviceLevel" TEXT,
    "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matchReason" TEXT,
    "shipmentId" TEXT,
    "networkOrderId" TEXT,
    "sellerTenantId" TEXT,
    "buyerTenantId" TEXT,

    CONSTRAINT "ShippingInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentCostAllocation" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "shippingInvoiceLineId" TEXT,
    "model" TEXT NOT NULL DEFAULT 'CHARGEBACK_SELLER',
    "sellerShareAmount" DECIMAL(12,2) NOT NULL,
    "platformShareAmount" DECIMAL(12,2) NOT NULL,
    "buyerShareAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentCostAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAuditLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" "TicketAuditAction" NOT NULL,
    "actorTenantId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerTrustScore" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "tier" "SellerRiskTier" NOT NULL DEFAULT 'A',
    "componentsJson" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SellerTrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerTrustEvent" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "type" "TrustEventType" NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerTrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreRecalcJob" (
    "id" TEXT NOT NULL,
    "sellerTenantId" TEXT NOT NULL,
    "status" "RecalcJobStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "RecalcReason" NOT NULL DEFAULT 'EVENT_DRIVEN',
    "idempotencyKey" TEXT NOT NULL,
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrustScoreRecalcJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryImpression" (
    "id" TEXT NOT NULL,
    "viewerTenantId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DECIMAL(10,4) NOT NULL,
    "reasonJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostRule" (
    "id" TEXT NOT NULL,
    "scope" "BoostScope" NOT NULL,
    "targetId" TEXT NOT NULL,
    "multiplier" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByTenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkPayment_providerPaymentKey_key" ON "NetworkPayment"("providerPaymentKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkPayment_attemptKey_key" ON "NetworkPayment"("attemptKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkPayment_releaseAttemptKey_key" ON "NetworkPayment"("releaseAttemptKey");

-- CreateIndex
CREATE INDEX "NetworkPayment_networkOrderId_idx" ON "NetworkPayment"("networkOrderId");

-- CreateIndex
CREATE INDEX "NetworkPayment_networkOrderId_status_idx" ON "NetworkPayment"("networkOrderId", "status");

-- CreateIndex
CREATE INDEX "NetworkPayment_status_idx" ON "NetworkPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEventInbox_providerEventId_key" ON "PaymentEventInbox"("providerEventId");

-- CreateIndex
CREATE INDEX "PaymentEventInbox_providerPaymentId_idx" ON "PaymentEventInbox"("providerPaymentId");

-- CreateIndex
CREATE INDEX "PaymentEventInbox_networkPaymentId_idx" ON "PaymentEventInbox"("networkPaymentId");

-- CreateIndex
CREATE INDEX "PaymentEventInbox_receivedAt_idx" ON "PaymentEventInbox"("receivedAt");

-- CreateIndex
CREATE INDEX "PaymentEventInbox_provider_idx" ON "PaymentEventInbox"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkOrder_completionKey_key" ON "NetworkOrder"("completionKey");

-- CreateIndex
CREATE INDEX "NetworkOrderItem_networkOrderId_idx" ON "NetworkOrderItem"("networkOrderId");

-- CreateIndex
CREATE INDEX "NetworkOrderItem_listingId_idx" ON "NetworkOrderItem"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerBalanceLedger_idempotencyKey_key" ON "SellerBalanceLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SellerBalanceLedger_sellerCompanyId_idx" ON "SellerBalanceLedger"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "SellerBalanceLedger_networkOrderId_idx" ON "SellerBalanceLedger"("networkOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCommissionLedger_idempotencyKey_key" ON "PlatformCommissionLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PlatformCommissionLedger_networkOrderId_idx" ON "PlatformCommissionLedger"("networkOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutEventInbox_providerEventId_key" ON "PayoutEventInbox"("providerEventId");

-- CreateIndex
CREATE INDEX "PayoutEventInbox_provider_idx" ON "PayoutEventInbox"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_initKey_key" ON "Shipment"("initKey");

-- CreateIndex
CREATE INDEX "Shipment_carrierCode_normalizedTracking_idx" ON "Shipment"("carrierCode", "normalizedTracking");

-- CreateIndex
CREATE INDEX "Shipment_carrierCode_idx" ON "Shipment"("carrierCode");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_networkOrderId_idx" ON "Shipment"("networkOrderId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_networkOrderId_sequence_key" ON "Shipment"("networkOrderId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_carrierCode_trackingNumber_key" ON "Shipment"("carrierCode", "trackingNumber");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_occurredAt_idx" ON "ShipmentEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentEventInbox_carrierEventId_key" ON "ShipmentEventInbox"("carrierEventId");

-- CreateIndex
CREATE INDEX "ShipmentEventInbox_trackingNumber_idx" ON "ShipmentEventInbox"("trackingNumber");

-- CreateIndex
CREATE INDEX "ShipmentEventInbox_shipmentId_idx" ON "ShipmentEventInbox"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentEventInbox_receivedAt_idx" ON "ShipmentEventInbox"("receivedAt");

-- CreateIndex
CREATE INDEX "ShipmentEventInbox_carrierCode_idx" ON "ShipmentEventInbox"("carrierCode");

-- CreateIndex
CREATE INDEX "GlobalProduct_categoryId_idx" ON "GlobalProduct"("categoryId");

-- CreateIndex
CREATE INDEX "GlobalProduct_status_idx" ON "GlobalProduct"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalCategory_slug_key" ON "GlobalCategory"("slug");

-- CreateIndex
CREATE INDEX "GlobalCategory_parentId_idx" ON "GlobalCategory"("parentId");

-- CreateIndex
CREATE INDEX "CategoryAttribute_categoryId_idx" ON "CategoryAttribute"("categoryId");

-- CreateIndex
CREATE INDEX "AttributeOption_attributeId_idx" ON "AttributeOption"("attributeId");

-- CreateIndex
CREATE INDEX "ERPProductCategory_sellerCompanyId_idx" ON "ERPProductCategory"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "ERPProductCategory_parentId_idx" ON "ERPProductCategory"("parentId");

-- CreateIndex
CREATE INDEX "CategoryMapping_sellerCompanyId_idx" ON "CategoryMapping"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "CategoryMapping_erpCategoryId_idx" ON "CategoryMapping"("erpCategoryId");

-- CreateIndex
CREATE INDEX "CategoryMapping_globalCategoryId_idx" ON "CategoryMapping"("globalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "B2BListingCategoryOverride_listingId_key" ON "B2BListingCategoryOverride"("listingId");

-- CreateIndex
CREATE INDEX "B2BListingCategoryOverride_globalCategoryId_idx" ON "B2BListingCategoryOverride"("globalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "B2BSuggestion_dedupeKey_key" ON "B2BSuggestion"("dedupeKey");

-- CreateIndex
CREATE INDEX "B2BSuggestion_sellerCompanyId_idx" ON "B2BSuggestion"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "B2BSuggestion_status_idx" ON "B2BSuggestion"("status");

-- CreateIndex
CREATE INDEX "B2BSuggestion_productId_idx" ON "B2BSuggestion"("productId");

-- CreateIndex
CREATE INDEX "B2BSuggestion_variantId_idx" ON "B2BSuggestion"("variantId");

-- CreateIndex
CREATE INDEX "AutomationDecisionLog_sellerCompanyId_idx" ON "AutomationDecisionLog"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "AutomationDecisionLog_variantId_idx" ON "AutomationDecisionLog"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAutomationPolicy_sellerCompanyId_key" ON "SellerAutomationPolicy"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "CommerceAuditLog_sellerCompanyId_idx" ON "CommerceAuditLog"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "CommerceAuditLog_action_idx" ON "CommerceAuditLog"("action");

-- CreateIndex
CREATE INDEX "CommerceAuditLog_createdAt_idx" ON "CommerceAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "NetworkListing_globalProductId_idx" ON "NetworkListing"("globalProductId");

-- CreateIndex
CREATE INDEX "NetworkListing_sellerCompanyId_idx" ON "NetworkListing"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "NetworkListing_status_idx" ON "NetworkListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkListing_sellerCompanyId_erpProductId_key" ON "NetworkListing"("sellerCompanyId", "erpProductId");

-- CreateIndex
CREATE INDEX "CompanyProductMap_companyId_idx" ON "CompanyProductMap"("companyId");

-- CreateIndex
CREATE INDEX "CompanyProductMap_globalProductId_idx" ON "CompanyProductMap"("globalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProductMap_companyId_globalProductId_key" ON "CompanyProductMap"("companyId", "globalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProductMap_companyId_erpProductId_key" ON "CompanyProductMap"("companyId", "erpProductId");

-- CreateIndex
CREATE INDEX "Rfq_buyerCompanyId_idx" ON "Rfq"("buyerCompanyId");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE INDEX "RfqItem_rfqId_idx" ON "RfqItem"("rfqId");

-- CreateIndex
CREATE INDEX "RfqItem_sellerCompanyId_idx" ON "RfqItem"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "SellerOffer_rfqId_idx" ON "SellerOffer"("rfqId");

-- CreateIndex
CREATE INDEX "SellerOffer_sellerCompanyId_idx" ON "SellerOffer"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "SellerOffer_status_idx" ON "SellerOffer"("status");

-- CreateIndex
CREATE INDEX "SellerOfferItem_sellerOfferId_idx" ON "SellerOfferItem"("sellerOfferId");

-- CreateIndex
CREATE INDEX "Contract_buyerCompanyId_idx" ON "Contract"("buyerCompanyId");

-- CreateIndex
CREATE INDEX "Contract_sellerCompanyId_idx" ON "Contract"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "ContractItem_contractId_idx" ON "ContractItem"("contractId");

-- CreateIndex
CREATE INDEX "ContractItem_productId_idx" ON "ContractItem"("productId");

-- CreateIndex
CREATE INDEX "ContractTier_contractItemId_idx" ON "ContractTier"("contractItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservedStock_contractItemId_key" ON "ReservedStock"("contractItemId");

-- CreateIndex
CREATE INDEX "ContractSLA_contractId_idx" ON "ContractSLA"("contractId");

-- CreateIndex
CREATE INDEX "RecurringOrder_contractId_idx" ON "RecurringOrder"("contractId");

-- CreateIndex
CREATE INDEX "RecurringOrder_nextRunAt_idx" ON "RecurringOrder"("nextRunAt");

-- CreateIndex
CREATE INDEX "PenaltyLedger_contractId_idx" ON "PenaltyLedger"("contractId");

-- CreateIndex
CREATE INDEX "ProductConsumption_companyId_idx" ON "ProductConsumption"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductConsumption_companyId_globalProductId_key" ON "ProductConsumption"("companyId", "globalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "BuySuggestion_dedupeKey_key" ON "BuySuggestion"("dedupeKey");

-- CreateIndex
CREATE INDEX "BuySuggestion_buyerCompanyId_idx" ON "BuySuggestion"("buyerCompanyId");

-- CreateIndex
CREATE INDEX "BuySuggestion_globalProductId_idx" ON "BuySuggestion"("globalProductId");

-- CreateIndex
CREATE INDEX "BuySuggestion_status_idx" ON "BuySuggestion"("status");

-- CreateIndex
CREATE INDEX "CommissionPlan_companyId_idx" ON "CommissionPlan"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPlan_companyId_isDefault_key" ON "CommissionPlan"("companyId", "isDefault");

-- CreateIndex
CREATE INDEX "CommissionRule_planId_idx" ON "CommissionRule"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSnapshot_networkOrderId_key" ON "CommissionSnapshot"("networkOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSnapshot_tenantId_networkOrderId_key" ON "CommissionSnapshot"("tenantId", "networkOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerEarning_shipmentId_key" ON "SellerEarning"("shipmentId");

-- CreateIndex
CREATE INDEX "SellerEarning_sellerCompanyId_idx" ON "SellerEarning"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "SellerEarning_status_idx" ON "SellerEarning"("status");

-- CreateIndex
CREATE INDEX "SellerEarning_expectedClearDate_idx" ON "SellerEarning"("expectedClearDate");

-- CreateIndex
CREATE UNIQUE INDEX "SellerEarning_sellerCompanyId_shipmentId_key" ON "SellerEarning"("sellerCompanyId", "shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseWindowPolicy_sellerCompanyId_key" ON "ReleaseWindowPolicy"("sellerCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseWindowPolicy_sellerCompanyId_isActiveDefault_key" ON "ReleaseWindowPolicy"("sellerCompanyId", "isActiveDefault");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_companyId_key" ON "LedgerAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerGroup_idempotencyKey_key" ON "LedgerGroup"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LedgerGroup_tenantId_idx" ON "LedgerGroup"("tenantId");

-- CreateIndex
CREATE INDEX "LedgerEntry_ledgerAccountId_idx" ON "LedgerEntry"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_groupId_idx" ON "LedgerEntry"("groupId");

-- CreateIndex
CREATE INDEX "LedgerEntry_tenantId_idx" ON "LedgerEntry"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_tenantId_idx" ON "IdempotencyRecord"("tenantId");

-- CreateIndex
CREATE INDEX "FinanceAuditLog_tenantId_idx" ON "FinanceAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "FinanceAuditLog_action_idx" ON "FinanceAuditLog"("action");

-- CreateIndex
CREATE INDEX "FinanceAuditLog_createdAt_idx" ON "FinanceAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInvoice_carrierId_invoiceNo_key" ON "ShippingInvoice"("carrierId", "invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInvoiceLine_shippingInvoiceId_trackingNo_key" ON "ShippingInvoiceLine"("shippingInvoiceId", "trackingNo");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentCostAllocation_shipmentId_shippingInvoiceLineId_key" ON "ShipmentCostAllocation"("shipmentId", "shippingInvoiceLineId");

-- CreateIndex
CREATE INDEX "TicketAuditLog_ticketId_idx" ON "TicketAuditLog"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerTrustScore_sellerTenantId_key" ON "SellerTrustScore"("sellerTenantId");

-- CreateIndex
CREATE INDEX "SellerTrustScore_tier_computedAt_idx" ON "SellerTrustScore"("tier", "computedAt");

-- CreateIndex
CREATE INDEX "SellerTrustEvent_sellerTenantId_occurredAt_idx" ON "SellerTrustEvent"("sellerTenantId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScoreRecalcJob_idempotencyKey_key" ON "TrustScoreRecalcJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DiscoveryImpression_viewerTenantId_createdAt_idx" ON "DiscoveryImpression"("viewerTenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoveryImpression_listingId_createdAt_idx" ON "DiscoveryImpression"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "BoostRule_scope_targetId_isActive_idx" ON "BoostRule"("scope", "targetId", "isActive");

-- CreateIndex
CREATE INDEX "BoostRule_startsAt_endsAt_idx" ON "BoostRule"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entity_createdAt_idx" ON "AuditLog"("tenantId", "entity", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_createdAt_idx" ON "AuditLog"("tenantId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "Order_companyId_orderDate_status_idx" ON "Order"("companyId", "orderDate", "status");

-- CreateIndex
CREATE INDEX "Order_companyId_deletedAt_createdAt_idx" ON "Order"("companyId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Product_companyId_deletedAt_category_idx" ON "Product"("companyId", "deletedAt", "category");

-- CreateIndex
CREATE INDEX "Product_companyId_isParent_deletedAt_idx" ON "Product"("companyId", "isParent", "deletedAt");

-- CreateIndex
CREATE INDEX "SalesInvoice_companyId_invoiceDate_status_idx" ON "SalesInvoice"("companyId", "invoiceDate", "status");

-- CreateIndex
CREATE INDEX "SecurityEvent_companyId_idx" ON "SecurityEvent"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_idempotencyKey_key" ON "StockMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_createdAt_type_idx" ON "StockMovement"("companyId", "createdAt", "type");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_status_idx" ON "Ticket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Ticket_relatedEntityType_relatedEntityId_idx" ON "Ticket"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkPayment" ADD CONSTRAINT "NetworkPayment_networkOrderId_fkey" FOREIGN KEY ("networkOrderId") REFERENCES "NetworkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkOrderItem" ADD CONSTRAINT "NetworkOrderItem_networkOrderId_fkey" FOREIGN KEY ("networkOrderId") REFERENCES "NetworkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkOrderItem" ADD CONSTRAINT "NetworkOrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "NetworkListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_networkOrderId_fkey" FOREIGN KEY ("networkOrderId") REFERENCES "NetworkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalProduct" ADD CONSTRAINT "GlobalProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GlobalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalCategory" ADD CONSTRAINT "GlobalCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GlobalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GlobalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ERPProductCategory" ADD CONSTRAINT "ERPProductCategory_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ERPProductCategory" ADD CONSTRAINT "ERPProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ERPProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMapping" ADD CONSTRAINT "CategoryMapping_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMapping" ADD CONSTRAINT "CategoryMapping_erpCategoryId_fkey" FOREIGN KEY ("erpCategoryId") REFERENCES "ERPProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMapping" ADD CONSTRAINT "CategoryMapping_globalCategoryId_fkey" FOREIGN KEY ("globalCategoryId") REFERENCES "GlobalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BListingCategoryOverride" ADD CONSTRAINT "B2BListingCategoryOverride_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "NetworkListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BListingCategoryOverride" ADD CONSTRAINT "B2BListingCategoryOverride_globalCategoryId_fkey" FOREIGN KEY ("globalCategoryId") REFERENCES "GlobalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BSuggestion" ADD CONSTRAINT "B2BSuggestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BSuggestion" ADD CONSTRAINT "B2BSuggestion_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationDecisionLog" ADD CONSTRAINT "AutomationDecisionLog_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerAutomationPolicy" ADD CONSTRAINT "SellerAutomationPolicy_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceAuditLog" ADD CONSTRAINT "CommerceAuditLog_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkListing" ADD CONSTRAINT "NetworkListing_globalProductId_fkey" FOREIGN KEY ("globalProductId") REFERENCES "GlobalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkListing" ADD CONSTRAINT "NetworkListing_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkListing" ADD CONSTRAINT "NetworkListing_erpProductId_fkey" FOREIGN KEY ("erpProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProductMap" ADD CONSTRAINT "CompanyProductMap_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProductMap" ADD CONSTRAINT "CompanyProductMap_globalProductId_fkey" FOREIGN KEY ("globalProductId") REFERENCES "GlobalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProductMap" ADD CONSTRAINT "CompanyProductMap_erpProductId_fkey" FOREIGN KEY ("erpProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqItem" ADD CONSTRAINT "RfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerOffer" ADD CONSTRAINT "SellerOffer_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerOfferItem" ADD CONSTRAINT "SellerOfferItem_sellerOfferId_fkey" FOREIGN KEY ("sellerOfferId") REFERENCES "SellerOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTier" ADD CONSTRAINT "ContractTier_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "ContractItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservedStock" ADD CONSTRAINT "ReservedStock_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "ContractItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSLA" ADD CONSTRAINT "ContractSLA_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOrder" ADD CONSTRAINT "RecurringOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductConsumption" ADD CONSTRAINT "ProductConsumption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuySuggestion" ADD CONSTRAINT "BuySuggestion_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlan" ADD CONSTRAINT "CommissionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CommissionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSnapshot" ADD CONSTRAINT "CommissionSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSnapshot" ADD CONSTRAINT "CommissionSnapshot_networkOrderId_fkey" FOREIGN KEY ("networkOrderId") REFERENCES "NetworkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerEarning" ADD CONSTRAINT "SellerEarning_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerEarning" ADD CONSTRAINT "SellerEarning_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseWindowPolicy" ADD CONSTRAINT "ReleaseWindowPolicy_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LedgerGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAuditLog" ADD CONSTRAINT "FinanceAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInvoiceLine" ADD CONSTRAINT "ShippingInvoiceLine_shippingInvoiceId_fkey" FOREIGN KEY ("shippingInvoiceId") REFERENCES "ShippingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInvoiceLine" ADD CONSTRAINT "ShippingInvoiceLine_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCostAllocation" ADD CONSTRAINT "ShipmentCostAllocation_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_counterpartyTenantId_fkey" FOREIGN KEY ("counterpartyTenantId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderTenantId_fkey" FOREIGN KEY ("senderTenantId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerTrustScore" ADD CONSTRAINT "SellerTrustScore_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerTrustEvent" ADD CONSTRAINT "SellerTrustEvent_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreRecalcJob" ADD CONSTRAINT "TrustScoreRecalcJob_sellerTenantId_fkey" FOREIGN KEY ("sellerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryImpression" ADD CONSTRAINT "DiscoveryImpression_viewerTenantId_fkey" FOREIGN KEY ("viewerTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryImpression" ADD CONSTRAINT "DiscoveryImpression_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "NetworkListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostRule" ADD CONSTRAINT "BoostRule_createdByTenantId_fkey" FOREIGN KEY ("createdByTenantId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
