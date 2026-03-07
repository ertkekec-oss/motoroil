-- CreateEnum
CREATE TYPE "ExportReportStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationDisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignatureEnvelopeStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "SignatureRecipientRole" AS ENUM ('SIGNER', 'CC', 'APPROVER');

-- CreateEnum
CREATE TYPE "SignatureRecipientStatus" AS ENUM ('PENDING', 'VIEWED', 'SIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignatureAuditAction" AS ENUM ('ENVELOPE_CREATED', 'RECIPIENT_ADDED', 'SESSION_STARTED', 'SIGN_PORTAL_VIEWED', 'RECIPIENT_SIGNED', 'RECIPIENT_REJECTED', 'ENVELOPE_COMPLETED', 'INVITATION_SENT_EMAIL', 'INVITATION_SENT_SMS', 'NEXT_SIGNER_INVITED', 'OTP_SENT', 'OTP_VERIFIED', 'OTP_VERIFICATION_FAILED', 'ENVELOPE_FINALIZED');

-- CreateEnum
CREATE TYPE "MailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('CONTRACT', 'AGREEMENT', 'RECONCILIATION', 'COMPANY_DOCUMENT', 'EMPLOYEE_DOCUMENT', 'FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkflowTaskType" AS ENUM ('RECON_DISPUTE', 'SIGNATURE_REVIEW', 'SIGNATURE_REJECTED', 'MAIL_FAILURE', 'OTP_FAILURE', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NetworkMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "NetworkProfileVisibilityLevel" AS ENUM ('PRIVATE', 'NETWORK', 'PUBLIC');

-- CreateEnum
CREATE TYPE "NetworkVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "CompanyRelationshipType" AS ENUM ('SUPPLIER', 'BUYER', 'DEALER', 'LOGISTICS_PARTNER', 'FINANCE_PARTNER', 'SERVICE_PARTNER', 'PROSPECT');

-- CreateEnum
CREATE TYPE "CompanyRelationshipDirectionType" AS ENUM ('ONE_WAY', 'MUTUAL');

-- CreateEnum
CREATE TYPE "CompanyRelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompanyRelationshipVisibilityScope" AS ENUM ('RELATIONSHIP_ONLY', 'LIMITED_NETWORK', 'PUBLIC_SIGNAL_ONLY');

-- CreateEnum
CREATE TYPE "NetworkInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "ReconciliationDispute" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "attachmentKey" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "message" TEXT;

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'GENERAL',
    "name" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "status" "ExportReportStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationPortalToken" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT,

    CONSTRAINT "ReconciliationPortalToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureEnvelope" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "documentFileName" TEXT NOT NULL,
    "status" "SignatureEnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "signedDocumentKey" TEXT,
    "otpRequired" BOOLEAN NOT NULL DEFAULT false,
    "sequentialSigning" BOOLEAN NOT NULL DEFAULT true,
    "documentCategory" "DocumentCategory",

    CONSTRAINT "SignatureEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureRecipient" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "SignatureRecipientRole" NOT NULL DEFAULT 'SIGNER',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "SignatureRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signerId" TEXT,

    CONSTRAINT "SignatureRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureSession" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "action" "SignatureAuditAction" NOT NULL,
    "actorId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpProviderConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiUsername" TEXT,
    "apiPasswordEncrypted" TEXT,
    "sender" TEXT,
    "otpTemplate" TEXT,
    "codeLength" INTEGER NOT NULL DEFAULT 6,
    "ttlSeconds" INTEGER NOT NULL DEFAULT 180,
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 60,
    "maxDailyAttempts" INTEGER NOT NULL DEFAULT 5,
    "testPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailDeliveryLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "provider" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "MailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "MailDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizedSigner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedCategories" "DocumentCategory"[],
    "defaultSigner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizedSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "type" "WorkflowTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "WorkflowTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "metaJson" JSONB,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "NetworkMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionTier" TEXT,
    "discoveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "profileCompletionScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCompanyProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "logoFileKey" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT DEFAULT 'Turkey',
    "city" TEXT,
    "sectors" JSONB,
    "capabilities" JSONB,
    "visibilityLevel" "NetworkProfileVisibilityLevel" NOT NULL DEFAULT 'PRIVATE',
    "verificationStatus" "NetworkVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isPublicListingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDiscoveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkCompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRelationship" (
    "id" TEXT NOT NULL,
    "sourceTenantId" TEXT NOT NULL,
    "targetTenantId" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "relationshipType" "CompanyRelationshipType" NOT NULL,
    "directionType" "CompanyRelationshipDirectionType" NOT NULL DEFAULT 'ONE_WAY',
    "status" "CompanyRelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedByTenantId" TEXT NOT NULL,
    "approvedByTenantId" TEXT,
    "visibilityScope" "CompanyRelationshipVisibilityScope" NOT NULL DEFAULT 'RELATIONSHIP_ONLY',
    "notes" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConnectionInvite" (
    "id" TEXT NOT NULL,
    "fromTenantId" TEXT NOT NULL,
    "toTenantId" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "proposedRelationshipType" "CompanyRelationshipType" NOT NULL,
    "message" TEXT,
    "status" "NetworkInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConnectionInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_idx" ON "CompanyDocument"("companyId");

-- CreateIndex
CREATE INDEX "CompanyDocument_tenantId_idx" ON "CompanyDocument"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_companyId_idx" ON "EmployeeDocument"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_tenantId_idx" ON "EmployeeDocument"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "ReconciliationDocument_tenantId_idx" ON "ReconciliationDocument"("tenantId");

-- CreateIndex
CREATE INDEX "ReconciliationDocument_reconciliationId_idx" ON "ReconciliationDocument"("reconciliationId");

-- CreateIndex
CREATE INDEX "ContractDocument_companyId_idx" ON "ContractDocument"("companyId");

-- CreateIndex
CREATE INDEX "ContractDocument_tenantId_idx" ON "ContractDocument"("tenantId");

-- CreateIndex
CREATE INDEX "ContractDocument_contractId_idx" ON "ContractDocument"("contractId");

-- CreateIndex
CREATE INDEX "ExportReport_tenantId_idx" ON "ExportReport"("tenantId");

-- CreateIndex
CREATE INDEX "ExportReport_companyId_idx" ON "ExportReport"("companyId");

-- CreateIndex
CREATE INDEX "ExportReport_status_idx" ON "ExportReport"("status");

-- CreateIndex
CREATE INDEX "ExportReport_reportType_idx" ON "ExportReport"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationPortalToken_tokenHash_key" ON "ReconciliationPortalToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SignatureEnvelope_tenantId_idx" ON "SignatureEnvelope"("tenantId");

-- CreateIndex
CREATE INDEX "SignatureEnvelope_companyId_idx" ON "SignatureEnvelope"("companyId");

-- CreateIndex
CREATE INDEX "SignatureRecipient_envelopeId_idx" ON "SignatureRecipient"("envelopeId");

-- CreateIndex
CREATE INDEX "SignatureRecipient_signerId_idx" ON "SignatureRecipient"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureSession_tokenHash_key" ON "SignatureSession"("tokenHash");

-- CreateIndex
CREATE INDEX "SignatureSession_envelopeId_idx" ON "SignatureSession"("envelopeId");

-- CreateIndex
CREATE INDEX "SignatureSession_recipientId_idx" ON "SignatureSession"("recipientId");

-- CreateIndex
CREATE INDEX "SignatureAuditEvent_envelopeId_idx" ON "SignatureAuditEvent"("envelopeId");

-- CreateIndex
CREATE INDEX "SignatureAuditEvent_tenantId_idx" ON "SignatureAuditEvent"("tenantId");

-- CreateIndex
CREATE INDEX "OtpProviderConfig_tenantId_idx" ON "OtpProviderConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpProviderConfig_tenantId_providerName_key" ON "OtpProviderConfig"("tenantId", "providerName");

-- CreateIndex
CREATE INDEX "OtpVerification_tenantId_idx" ON "OtpVerification"("tenantId");

-- CreateIndex
CREATE INDEX "OtpVerification_phone_idx" ON "OtpVerification"("phone");

-- CreateIndex
CREATE INDEX "MailDeliveryLog_tenantId_idx" ON "MailDeliveryLog"("tenantId");

-- CreateIndex
CREATE INDEX "MailDeliveryLog_companyId_idx" ON "MailDeliveryLog"("companyId");

-- CreateIndex
CREATE INDEX "MailDeliveryLog_status_idx" ON "MailDeliveryLog"("status");

-- CreateIndex
CREATE INDEX "MailDeliveryLog_category_idx" ON "MailDeliveryLog"("category");

-- CreateIndex
CREATE INDEX "MailDeliveryLog_relatedEntityType_relatedEntityId_idx" ON "MailDeliveryLog"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "AppNotification_tenantId_idx" ON "AppNotification"("tenantId");

-- CreateIndex
CREATE INDEX "AppNotification_companyId_idx" ON "AppNotification"("companyId");

-- CreateIndex
CREATE INDEX "AppNotification_userId_idx" ON "AppNotification"("userId");

-- CreateIndex
CREATE INDEX "AppNotification_isRead_idx" ON "AppNotification"("isRead");

-- CreateIndex
CREATE INDEX "AppNotification_type_idx" ON "AppNotification"("type");

-- CreateIndex
CREATE INDEX "AuthorizedSigner_tenantId_idx" ON "AuthorizedSigner"("tenantId");

-- CreateIndex
CREATE INDEX "AuthorizedSigner_companyId_idx" ON "AuthorizedSigner"("companyId");

-- CreateIndex
CREATE INDEX "AuthorizedSigner_isActive_idx" ON "AuthorizedSigner"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowTask_tenantId_idx" ON "WorkflowTask"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowTask_companyId_idx" ON "WorkflowTask"("companyId");

-- CreateIndex
CREATE INDEX "WorkflowTask_assigneeId_idx" ON "WorkflowTask"("assigneeId");

-- CreateIndex
CREATE INDEX "WorkflowTask_type_idx" ON "WorkflowTask"("type");

-- CreateIndex
CREATE INDEX "WorkflowTask_status_idx" ON "WorkflowTask"("status");

-- CreateIndex
CREATE INDEX "WorkflowTask_priority_idx" ON "WorkflowTask"("priority");

-- CreateIndex
CREATE INDEX "WorkflowTask_relatedEntityType_relatedEntityId_idx" ON "WorkflowTask"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkMembership_tenantId_key" ON "NetworkMembership"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkMembership_status_idx" ON "NetworkMembership"("status");

-- CreateIndex
CREATE INDEX "NetworkMembership_discoveryEnabled_idx" ON "NetworkMembership"("discoveryEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCompanyProfile_tenantId_key" ON "NetworkCompanyProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCompanyProfile_slug_key" ON "NetworkCompanyProfile"("slug");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_visibilityLevel_idx" ON "NetworkCompanyProfile"("visibilityLevel");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_verificationStatus_idx" ON "NetworkCompanyProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_isDiscoveryEnabled_idx" ON "NetworkCompanyProfile"("isDiscoveryEnabled");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_isPublicListingEnabled_idx" ON "NetworkCompanyProfile"("isPublicListingEnabled");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_city_idx" ON "NetworkCompanyProfile"("city");

-- CreateIndex
CREATE INDEX "NetworkCompanyProfile_country_idx" ON "NetworkCompanyProfile"("country");

-- CreateIndex
CREATE INDEX "CompanyRelationship_sourceTenantId_status_idx" ON "CompanyRelationship"("sourceTenantId", "status");

-- CreateIndex
CREATE INDEX "CompanyRelationship_targetTenantId_status_idx" ON "CompanyRelationship"("targetTenantId", "status");

-- CreateIndex
CREATE INDEX "CompanyRelationship_relationshipType_idx" ON "CompanyRelationship"("relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRelationship_sourceTenantId_targetTenantId_relations_key" ON "CompanyRelationship"("sourceTenantId", "targetTenantId", "relationshipType");

-- CreateIndex
CREATE INDEX "NetworkConnectionInvite_fromTenantId_status_idx" ON "NetworkConnectionInvite"("fromTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkConnectionInvite_toTenantId_status_idx" ON "NetworkConnectionInvite"("toTenantId", "status");

-- CreateIndex
CREATE INDEX "NetworkConnectionInvite_status_expiresAt_idx" ON "NetworkConnectionInvite"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationDocument" ADD CONSTRAINT "ReconciliationDocument_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDocument" ADD CONSTRAINT "ContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportReport" ADD CONSTRAINT "ExportReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationPortalToken" ADD CONSTRAINT "ReconciliationPortalToken_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRecipient" ADD CONSTRAINT "SignatureRecipient_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "AuthorizedSigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRecipient" ADD CONSTRAINT "SignatureRecipient_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureSession" ADD CONSTRAINT "SignatureSession_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureSession" ADD CONSTRAINT "SignatureSession_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "SignatureRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAuditEvent" ADD CONSTRAINT "SignatureAuditEvent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkMembership" ADD CONSTRAINT "NetworkMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCompanyProfile" ADD CONSTRAINT "NetworkCompanyProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelationship" ADD CONSTRAINT "CompanyRelationship_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelationship" ADD CONSTRAINT "CompanyRelationship_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnectionInvite" ADD CONSTRAINT "NetworkConnectionInvite_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnectionInvite" ADD CONSTRAINT "NetworkConnectionInvite_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "NetworkCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
