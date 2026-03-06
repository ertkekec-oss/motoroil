/*
  Warnings:

  - You are about to alter the column `imageUrl` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.

*/
-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'VIEWED', 'SIGNING', 'SIGNED', 'REJECTED', 'DISPUTED', 'EXPIRED', 'VOID');

-- CreateEnum
CREATE TYPE "ReconDeliveryMethod" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ReconAuthMethod" AS ENUM ('OTP', 'QUALIFIED_ESIGN', 'BOTH');

-- CreateEnum
CREATE TYPE "ReconCounterpartyRole" AS ENUM ('COUNTERPARTY', 'CC');

-- CreateEnum
CREATE TYPE "ReconCounterpartyStatus" AS ENUM ('PENDING', 'NOTIFIED', 'VIEWED', 'SIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReconDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReconDisputeReason" AS ENUM ('AMOUNT_MISMATCH', 'MISSING_TX', 'DUPLICATE_TX', 'OTHER');

-- CreateEnum
CREATE TYPE "ReconActorType" AS ENUM ('USER', 'COUNTERPARTY', 'SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReconAuditAction" AS ENUM ('CREATED', 'SNAPSHOT_GENERATED', 'SENT', 'VIEWED', 'SIGNING_STARTED', 'SIGNED', 'REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'VOIDED', 'EXPIRED', 'CONTRACT_LINKED', 'GATE_SIGNAL_EMITTED');

-- CreateEnum
CREATE TYPE "ReconciliationHealth" AS ENUM ('OK', 'MISSING', 'OVERDUE', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DealerCatalogVisibility" AS ENUM ('HIDDEN', 'VISIBLE');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TemplateEngine" AS ENUM ('HTML', 'PDF_FORM');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'GENERATED', 'PENDING_SIGN', 'SENT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'EXPIRED', 'VOID');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('TEMPLATE', 'UPLOAD', 'API');

-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNING', 'COMPLETED', 'DECLINED', 'VOIDED');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('CREATED', 'SENT', 'DELIVERED', 'VIEWED', 'OTP_VERIFIED', 'SIGNING', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "RecipientRole" AS ENUM ('SIGNER', 'CC', 'APPROVER');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('NONE', 'EMAIL_OTP', 'SMS_OTP');

-- CreateEnum
CREATE TYPE "ContractAuditAction" AS ENUM ('CREATED', 'UPDATED', 'SENT', 'DELIVERED', 'VIEWED', 'OTP_REQUESTED', 'OTP_VERIFIED', 'SIGN_STARTED', 'SIGN_COMPLETED', 'SIGNED', 'DECLINED', 'COMPLETED', 'VOIDED', 'DOWNLOADED', 'PDF_RENDER_QUEUED', 'PDF_RENDERED', 'OTP_SENT', 'WEBHOOK_VERIFIED', 'AUDIT_EXPORTED', 'CONTRACT_GENERATED', 'CLAUSE_INSERTED', 'CONTRACT_RENDERED', 'CONTRACT_SIGNED', 'NETWORK_AGREEMENT_ACTIVATED');

-- CreateEnum
CREATE TYPE "TemplateSourceType" AS ENUM ('ACCOUNT', 'ORDER', 'USER', 'TENANT');

-- CreateEnum
CREATE TYPE "ClauseCategory" AS ENUM ('PAYMENT_TERMS', 'CONFIDENTIALITY', 'TERMINATION', 'JURISDICTION', 'FORCE_MAJEURE', 'WARRANTY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractActorType" AS ENUM ('SYSTEM', 'USER', 'RECIPIENT');

-- CreateEnum
CREATE TYPE "RenderStatus" AS ENUM ('PENDING', 'RENDERING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('REQUIRED', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "GateResult" AS ENUM ('ALLOWED', 'ESCROW_REQUIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('REQUIRED', 'FUNDS_HELD', 'RELEASE_REQUESTED', 'SETTLEMENT_EXECUTING', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "HoldMode" AS ENUM ('PROVIDER_NATIVE', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "EscrowAction" AS ENUM ('HOLD_REQUESTED', 'HOLD_CONFIRMED', 'RELEASE_REQUESTED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED', 'DISPUTE_OPENED', 'DISPUTE_CLOSED');

-- CreateEnum
CREATE TYPE "NetworkDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NetworkDisputeReason" AS ENUM ('DAMAGED', 'MISSING', 'NOT_DELIVERED', 'PRICE_MISMATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "NetworkDisputeAction" AS ENUM ('OPENED', 'MESSAGE_ADDED', 'EVIDENCE_ATTACHED', 'ESCALATED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELED', 'REFUNDED', 'CHARGEBACK_OPENED', 'CHARGEBACK_WON', 'CHARGEBACK_LOST');

-- CreateEnum
CREATE TYPE "SettlementInstructionStatus" AS ENUM ('PENDING', 'EXECUTING', 'SETTLED', 'FAILED', 'CANCELED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "SettlementPayeeType" AS ENUM ('SUPPLIER_BANK', 'DEALER_REFUND', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "B2BPayeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'NEEDS_VERIFICATION');

-- CreateEnum
CREATE TYPE "IntegrationInboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "B2BLedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "B2BJournalEntryStatus" AS ENUM ('POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "B2BJournalSourceType" AS ENUM ('ORDER', 'ESCROW', 'REFUND', 'CORRECTION');

-- CreateEnum
CREATE TYPE "B2BOutboxEventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "OpsDrillStatus" AS ENUM ('PASSED', 'FAILED', 'NEEDS_IMPROVEMENT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageKey" VARCHAR(1024),
ALTER COLUMN "imageUrl" SET DATA TYPE VARCHAR(2048);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveryMethod" "ReconDeliveryMethod" NOT NULL DEFAULT 'INTERNAL',
    "authMethod" "ReconAuthMethod" NOT NULL DEFAULT 'OTP',
    "linkedContractId" TEXT,
    "linkedEnvelopeId" TEXT,
    "signedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationSnapshot" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "totalDebit" DECIMAL(15,2) NOT NULL,
    "totalCredit" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "transactionId" TEXT,
    "sourceType" TEXT DEFAULT 'LEDGER_TX',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "refJson" JSONB,
    "hashSha256" TEXT,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationCounterparty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "role" "ReconCounterpartyRole" NOT NULL DEFAULT 'COUNTERPARTY',
    "status" "ReconCounterpartyStatus" NOT NULL DEFAULT 'PENDING',
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationCounterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationDispute" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "status" "ReconDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" "ReconDisputeReason" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdByActorType" "ReconActorType" NOT NULL DEFAULT 'USER',
    "createdByActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReconciliationDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationDisputeItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "reconciliationItemId" TEXT,
    "proposedDebit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "proposedCredit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationDisputeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "actorType" "ReconActorType" NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "action" "ReconAuditAction" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationPolicySnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "settingsJson" JSONB NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationPolicySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountReconciliationStatus" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "lastSignedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "lastReconId" TEXT,
    "health" "ReconciliationHealth" NOT NULL DEFAULT 'MISSING',
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "hasOpenDispute" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountReconciliationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerCatalogItem" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "visibility" "DealerCatalogVisibility" NOT NULL DEFAULT 'VISIBLE',
    "price" DECIMAL(12,2),
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "maxOrderQty" INTEGER,
    "dealerGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileBlob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" JSONB,
    "engine" "TemplateEngine" NOT NULL DEFAULT 'HTML',
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bodyContent" TEXT NOT NULL,
    "schemaJson" JSONB,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTemplateMapping" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sourceType" "TemplateSourceType" NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplateMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clause" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ClauseCategory" NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "source" "DocumentSource" NOT NULL DEFAULT 'TEMPLATE',
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "templateVersionId" TEXT,
    "linkedAccountId" TEXT,
    "linkedOrderId" TEXT,
    "linkedEmployeeId" TEXT,
    "linkedReconciliationId" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileBlobId" TEXT,
    "bodySnapshot" TEXT,
    "renderStatus" "RenderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Envelope" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "signedPdfBlobId" TEXT,
    "certChainBlobId" TEXT,
    "ocspCrlBlobId" TEXT,
    "timestampTokenBlobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Envelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "RecipientRole" NOT NULL DEFAULT 'SIGNER',
    "status" "RecipientStatus" NOT NULL DEFAULT 'CREATED',
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "authMethod" "AuthMethod" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SigningSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "publicTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tokenUsedAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "otpState" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureProviderConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "credentialsEncrypted" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookInbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerKey" TEXT,
    "payloadBlobId" TEXT,
    "headers" JSONB,
    "payload" JSONB,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "envelopeId" TEXT,
    "recipientId" TEXT,
    "actorType" "ContractActorType" NOT NULL,
    "actorId" TEXT,
    "action" "ContractAuditAction" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HashLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "hashValue" TEXT NOT NULL,
    "previousHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HashLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureArtifact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "signedPdfBlobId" TEXT NOT NULL,
    "certChainBlobId" TEXT,
    "ocspCrlBlobId" TEXT,
    "timestampTokenBlobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkAgreement" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "dealerTenantId" TEXT,
    "membershipId" TEXT NOT NULL,
    "contractId" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'REQUIRED',
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "policySnapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkPolicySnapshot" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "termsJson" JSONB NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkPolicySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkGateResult" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "orderDraftId" TEXT,
    "orderId" TEXT,
    "result" "GateResult" NOT NULL,
    "reasonCodesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkGateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowCase" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "EscrowStatus" NOT NULL DEFAULT 'REQUIRED',
    "holdMode" "HoldMode" NOT NULL DEFAULT 'OPERATIONAL',
    "providerKey" TEXT NOT NULL DEFAULT 'manual',
    "providerRef" TEXT,
    "policySnapshotJson" JSONB,
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowEvent" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "escrowCaseId" TEXT NOT NULL,
    "action" "EscrowAction" NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDisputeCase" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "escrowCaseId" TEXT,
    "status" "NetworkDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" "NetworkDisputeReason" NOT NULL,
    "claimedAmount" DECIMAL(65,30),
    "notes" TEXT,
    "evidenceBundleBlobId" TEXT,
    "createdBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkDisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDisputeEvent" (
    "id" TEXT NOT NULL,
    "supplierTenantId" TEXT NOT NULL,
    "disputeCaseId" TEXT NOT NULL,
    "action" "NetworkDisputeAction" NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkDisputeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BPayeeProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payeeType" "SettlementPayeeType" NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "ibanMasked" TEXT,
    "ibanEncrypted" TEXT,
    "bankName" TEXT,
    "taxId" TEXT,
    "status" "B2BPayeeStatus" NOT NULL DEFAULT 'NEEDS_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BPayeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BBankTransactionInbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankTxId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "iban" TEXT,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "settlementInstId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BBankTransactionInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'CREATED',
    "providerKey" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerRef" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementInstruction" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "escrowCaseId" TEXT NOT NULL,
    "payeeType" "SettlementPayeeType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "SettlementInstructionStatus" NOT NULL DEFAULT 'PENDING',
    "providerKey" TEXT NOT NULL,
    "providerRef" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationInbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "payloadBlobId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "IntegrationInboxStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,

    CONSTRAINT "IntegrationInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BLedgerAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "B2BLedgerAccountType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BLedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BJournalEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" "B2BJournalSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalEntryId" TEXT,
    "reason" TEXT,
    "status" "B2BJournalEntryStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BJournalLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BJournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BOutboxEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "B2BOutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "B2BOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BSystemConfig" (
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "B2BSystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OpsDrillRun" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rtoMinutes" INTEGER,
    "rpoMinutes" INTEGER,
    "status" "OpsDrillStatus" NOT NULL DEFAULT 'PASSED',
    "detailsJson" JSONB,
    "createdBy" TEXT,

    CONSTRAINT "OpsDrillRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reconciliation_tenantId_idx" ON "Reconciliation"("tenantId");

-- CreateIndex
CREATE INDEX "Reconciliation_accountId_idx" ON "Reconciliation"("accountId");

-- CreateIndex
CREATE INDEX "Reconciliation_status_idx" ON "Reconciliation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationSnapshot_reconciliationId_key" ON "ReconciliationSnapshot"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationItem_reconciliationId_idx" ON "ReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationCounterparty_reconciliationId_idx" ON "ReconciliationCounterparty"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationCounterparty_tenantId_idx" ON "ReconciliationCounterparty"("tenantId");

-- CreateIndex
CREATE INDEX "ReconciliationDispute_reconciliationId_idx" ON "ReconciliationDispute"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationDispute_tenantId_idx" ON "ReconciliationDispute"("tenantId");

-- CreateIndex
CREATE INDEX "ReconciliationDisputeItem_disputeId_idx" ON "ReconciliationDisputeItem"("disputeId");

-- CreateIndex
CREATE INDEX "ReconciliationAuditEvent_reconciliationId_idx" ON "ReconciliationAuditEvent"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationAuditEvent_tenantId_idx" ON "ReconciliationAuditEvent"("tenantId");

-- CreateIndex
CREATE INDEX "ReconciliationPolicySnapshot_tenantId_idx" ON "ReconciliationPolicySnapshot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountReconciliationStatus_accountId_key" ON "AccountReconciliationStatus"("accountId");

-- CreateIndex
CREATE INDEX "AccountReconciliationStatus_tenantId_idx" ON "AccountReconciliationStatus"("tenantId");

-- CreateIndex
CREATE INDEX "AccountReconciliationStatus_health_idx" ON "AccountReconciliationStatus"("health");

-- CreateIndex
CREATE UNIQUE INDEX "AccountReconciliationStatus_tenantId_accountId_key" ON "AccountReconciliationStatus"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "DealerCatalogItem_supplierTenantId_idx" ON "DealerCatalogItem"("supplierTenantId");

-- CreateIndex
CREATE INDEX "DealerCatalogItem_productId_idx" ON "DealerCatalogItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerCatalogItem_supplierTenantId_productId_key" ON "DealerCatalogItem"("supplierTenantId", "productId");

-- CreateIndex
CREATE INDEX "FileBlob_tenantId_idx" ON "FileBlob"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_idx" ON "DocumentTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "TemplateVersion_tenantId_idx" ON "TemplateVersion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "ContractTemplateMapping_templateId_idx" ON "ContractTemplateMapping"("templateId");

-- CreateIndex
CREATE INDEX "Clause_tenantId_idx" ON "Clause"("tenantId");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE INDEX "Document_linkedAccountId_idx" ON "Document"("linkedAccountId");

-- CreateIndex
CREATE INDEX "Document_linkedOrderId_idx" ON "Document"("linkedOrderId");

-- CreateIndex
CREATE INDEX "DocumentVersion_tenantId_idx" ON "DocumentVersion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "Envelope_tenantId_idx" ON "Envelope"("tenantId");

-- CreateIndex
CREATE INDEX "Recipient_envelopeId_orderIndex_idx" ON "Recipient"("envelopeId", "orderIndex");

-- CreateIndex
CREATE INDEX "Recipient_tenantId_idx" ON "Recipient"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SigningSession_recipientId_key" ON "SigningSession"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "SigningSession_publicTokenHash_key" ON "SigningSession"("publicTokenHash");

-- CreateIndex
CREATE INDEX "SigningSession_tenantId_idx" ON "SigningSession"("tenantId");

-- CreateIndex
CREATE INDEX "SignatureProviderConfig_tenantId_idx" ON "SignatureProviderConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureProviderConfig_tenantId_providerKey_key" ON "SignatureProviderConfig"("tenantId", "providerKey");

-- CreateIndex
CREATE INDEX "WebhookInbox_tenantId_idx" ON "WebhookInbox"("tenantId");

-- CreateIndex
CREATE INDEX "ContractAuditEvent_envelopeId_createdAt_idx" ON "ContractAuditEvent"("envelopeId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractAuditEvent_tenantId_idx" ON "ContractAuditEvent"("tenantId");

-- CreateIndex
CREATE INDEX "HashLedger_tenantId_idx" ON "HashLedger"("tenantId");

-- CreateIndex
CREATE INDEX "HashLedger_targetType_targetId_idx" ON "HashLedger"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "SignatureArtifact_envelopeId_idx" ON "SignatureArtifact"("envelopeId");

-- CreateIndex
CREATE INDEX "SignatureArtifact_tenantId_idx" ON "SignatureArtifact"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkAgreement_supplierTenantId_idx" ON "NetworkAgreement"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkAgreement_membershipId_idx" ON "NetworkAgreement"("membershipId");

-- CreateIndex
CREATE INDEX "NetworkPolicySnapshot_supplierTenantId_idx" ON "NetworkPolicySnapshot"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkPolicySnapshot_agreementId_idx" ON "NetworkPolicySnapshot"("agreementId");

-- CreateIndex
CREATE INDEX "NetworkGateResult_supplierTenantId_idx" ON "NetworkGateResult"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkGateResult_membershipId_idx" ON "NetworkGateResult"("membershipId");

-- CreateIndex
CREATE INDEX "EscrowCase_supplierTenantId_idx" ON "EscrowCase"("supplierTenantId");

-- CreateIndex
CREATE INDEX "EscrowCase_orderId_idx" ON "EscrowCase"("orderId");

-- CreateIndex
CREATE INDEX "EscrowEvent_supplierTenantId_idx" ON "EscrowEvent"("supplierTenantId");

-- CreateIndex
CREATE INDEX "EscrowEvent_escrowCaseId_idx" ON "EscrowEvent"("escrowCaseId");

-- CreateIndex
CREATE INDEX "NetworkDisputeCase_supplierTenantId_idx" ON "NetworkDisputeCase"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkDisputeCase_orderId_idx" ON "NetworkDisputeCase"("orderId");

-- CreateIndex
CREATE INDEX "NetworkDisputeEvent_supplierTenantId_idx" ON "NetworkDisputeEvent"("supplierTenantId");

-- CreateIndex
CREATE INDEX "NetworkDisputeEvent_disputeCaseId_idx" ON "NetworkDisputeEvent"("disputeCaseId");

-- CreateIndex
CREATE INDEX "B2BPayeeProfile_tenantId_idx" ON "B2BPayeeProfile"("tenantId");

-- CreateIndex
CREATE INDEX "B2BPayeeProfile_counterpartyId_idx" ON "B2BPayeeProfile"("counterpartyId");

-- CreateIndex
CREATE UNIQUE INDEX "B2BBankTransactionInbox_bankTxId_key" ON "B2BBankTransactionInbox"("bankTxId");

-- CreateIndex
CREATE INDEX "B2BBankTransactionInbox_tenantId_idx" ON "B2BBankTransactionInbox"("tenantId");

-- CreateIndex
CREATE INDEX "B2BBankTransactionInbox_matched_idx" ON "B2BBankTransactionInbox"("matched");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_tenantId_idx" ON "PaymentIntent"("tenantId");

-- CreateIndex
CREATE INDEX "PaymentIntent_orderId_idx" ON "PaymentIntent"("orderId");

-- CreateIndex
CREATE INDEX "PaymentIntent_membershipId_idx" ON "PaymentIntent"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementInstruction_idempotencyKey_key" ON "SettlementInstruction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SettlementInstruction_tenantId_idx" ON "SettlementInstruction"("tenantId");

-- CreateIndex
CREATE INDEX "SettlementInstruction_escrowCaseId_idx" ON "SettlementInstruction"("escrowCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationInbox_providerEventId_key" ON "IntegrationInbox"("providerEventId");

-- CreateIndex
CREATE INDEX "IntegrationInbox_tenantId_idx" ON "IntegrationInbox"("tenantId");

-- CreateIndex
CREATE INDEX "IntegrationInbox_providerKey_idx" ON "IntegrationInbox"("providerKey");

-- CreateIndex
CREATE INDEX "IntegrationInbox_status_idx" ON "IntegrationInbox"("status");

-- CreateIndex
CREATE UNIQUE INDEX "B2BLedgerAccount_tenantId_code_key" ON "B2BLedgerAccount"("tenantId", "code");

-- CreateIndex
CREATE INDEX "B2BJournalEntry_tenantId_idx" ON "B2BJournalEntry"("tenantId");

-- CreateIndex
CREATE INDEX "B2BJournalEntry_sourceType_sourceId_idx" ON "B2BJournalEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "B2BJournalLine_tenantId_idx" ON "B2BJournalLine"("tenantId");

-- CreateIndex
CREATE INDEX "B2BJournalLine_entryId_idx" ON "B2BJournalLine"("entryId");

-- CreateIndex
CREATE INDEX "B2BJournalLine_accountId_idx" ON "B2BJournalLine"("accountId");

-- CreateIndex
CREATE INDEX "B2BOutboxEvent_status_idx" ON "B2BOutboxEvent"("status");

-- CreateIndex
CREATE INDEX "B2BOutboxEvent_topic_idx" ON "B2BOutboxEvent"("topic");

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationSnapshot" ADD CONSTRAINT "ReconciliationSnapshot_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationCounterparty" ADD CONSTRAINT "ReconciliationCounterparty_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationDispute" ADD CONSTRAINT "ReconciliationDispute_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationDisputeItem" ADD CONSTRAINT "ReconciliationDisputeItem_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "ReconciliationDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationDisputeItem" ADD CONSTRAINT "ReconciliationDisputeItem_reconciliationItemId_fkey" FOREIGN KEY ("reconciliationItemId") REFERENCES "ReconciliationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationAuditEvent" ADD CONSTRAINT "ReconciliationAuditEvent_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountReconciliationStatus" ADD CONSTRAINT "AccountReconciliationStatus_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerCatalogItem" ADD CONSTRAINT "DealerCatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTemplateMapping" ADD CONSTRAINT "ContractTemplateMapping_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_fileBlobId_fkey" FOREIGN KEY ("fileBlobId") REFERENCES "FileBlob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Envelope" ADD CONSTRAINT "Envelope_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Envelope" ADD CONSTRAINT "Envelope_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigningSession" ADD CONSTRAINT "SigningSession_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAuditEvent" ADD CONSTRAINT "ContractAuditEvent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAuditEvent" ADD CONSTRAINT "ContractAuditEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureArtifact" ADD CONSTRAINT "SignatureArtifact_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureArtifact" ADD CONSTRAINT "SignatureArtifact_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkAgreement" ADD CONSTRAINT "NetworkAgreement_policySnapshotId_fkey" FOREIGN KEY ("policySnapshotId") REFERENCES "NetworkPolicySnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkPolicySnapshot" ADD CONSTRAINT "NetworkPolicySnapshot_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "NetworkAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowEvent" ADD CONSTRAINT "EscrowEvent_escrowCaseId_fkey" FOREIGN KEY ("escrowCaseId") REFERENCES "EscrowCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDisputeEvent" ADD CONSTRAINT "NetworkDisputeEvent_disputeCaseId_fkey" FOREIGN KEY ("disputeCaseId") REFERENCES "NetworkDisputeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BJournalLine" ADD CONSTRAINT "B2BJournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "B2BJournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BJournalLine" ADD CONSTRAINT "B2BJournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "B2BLedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
