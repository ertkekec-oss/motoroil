-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('DEALER_INVITE_ISSUED', 'DEALER_INVITE_REDEEMED', 'OTP_REQUESTED', 'OTP_VERIFIED', 'CONTEXT_SWITCHED', 'CHECKOUT_RESERVED', 'ORDER_APPROVED', 'ORDER_REJECTED', 'RESERVATION_RELEASED', 'PAYMENT_INTENT_CREATED', 'PAYMENT_CALLBACK_VERIFIED', 'PAYMENT_FAILED', 'REFUND_REQUESTED', 'REFUND_SUCCEEDED', 'REFUND_FAILED');

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorDealerUserId" TEXT,
    "actorIp" TEXT,
    "actorUa" TEXT,
    "type" "AuditEventType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "membershipId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_type_createdAt_idx" ON "AuditEvent"("tenantId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_entityType_entityId_idx" ON "AuditEvent"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_membershipId_createdAt_idx" ON "AuditEvent"("membershipId", "createdAt");
