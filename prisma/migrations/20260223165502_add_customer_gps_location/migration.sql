/*
  Warnings:

  - You are about to drop the column `age` on the `Staff` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PdksType" AS ENUM ('SHIFT_START', 'SHIFT_END', 'BREAK_START', 'BREAK_END');

-- CreateEnum
CREATE TYPE "PdksMode" AS ENUM ('OFFICE_QR', 'FIELD_GPS');

-- CreateEnum
CREATE TYPE "PdksStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'BUG');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('P1_URGENT', 'P2_HIGH', 'P3_NORMAL', 'P4_LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuthorType" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "targetCustomerCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "assignedStaffId" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "locationPinnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "SalesVisit" ADD COLUMN     "result" TEXT;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "age",
ADD COLUMN     "assignedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "certificate" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "dailyWorkingHours" DOUBLE PRECISION DEFAULT 8,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "hasDriverLicense" BOOLEAN DEFAULT false,
ADD COLUMN     "healthReport" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "militaryStatus" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "relativeName" TEXT,
ADD COLUMN     "relativePhone" TEXT,
ADD COLUMN     "shiftTemplate" TEXT,
ADD COLUMN     "weeklyOffDays" TEXT DEFAULT 'Sunday',
ADD COLUMN     "workType" TEXT DEFAULT 'FULL_TIME';

-- AlterTable
ALTER TABLE "StaffTarget" ADD COLUMN     "bonusAmount" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "commissionRate" DECIMAL(5,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "visitId" TEXT;

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "locationIn" TEXT,
    "locationOut" TEXT,
    "deviceInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_TIME',
    "workingHours" DOUBLE PRECISION DEFAULT 0,
    "isPuantajOk" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteTemplateStop" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "RouteTemplateStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdksDisplay" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pairingCode" TEXT NOT NULL,
    "lastPublicIp" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdksDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdksEmployeeDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceFp" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdksEmployeeDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdksEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "type" "PdksType" NOT NULL,
    "mode" "PdksMode" NOT NULL,
    "status" "PdksStatus" NOT NULL DEFAULT 'APPROVED',
    "deviceFp" TEXT NOT NULL,
    "requestPublicIp" TEXT,
    "displayPublicIp" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "clientTime" TIMESTAMP(3) NOT NULL,
    "serverTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" JSONB,
    "offlineId" TEXT,
    "notes" TEXT,

    CONSTRAINT "PdksEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdksIdempotency" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offlineId" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdksIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "staffId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpTopic" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "TicketPriority" NOT NULL DEFAULT 'P3_NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "tenantId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "relatedHelpTopicId" TEXT,
    "metadataJson" JSONB,
    "assignedToUserId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" "AuthorType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_staffId_idx" ON "Attendance"("staffId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "RouteTemplate_companyId_idx" ON "RouteTemplate"("companyId");

-- CreateIndex
CREATE INDEX "RouteTemplateStop_templateId_idx" ON "RouteTemplateStop"("templateId");

-- CreateIndex
CREATE INDEX "RouteTemplateStop_customerId_idx" ON "RouteTemplateStop"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PdksDisplay_pairingCode_key" ON "PdksDisplay"("pairingCode");

-- CreateIndex
CREATE INDEX "PdksDisplay_tenantId_siteId_idx" ON "PdksDisplay"("tenantId", "siteId");

-- CreateIndex
CREATE INDEX "PdksEmployeeDevice_tenantId_userId_idx" ON "PdksEmployeeDevice"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PdksEmployeeDevice_tenantId_userId_deviceFp_key" ON "PdksEmployeeDevice"("tenantId", "userId", "deviceFp");

-- CreateIndex
CREATE UNIQUE INDEX "PdksEvent_offlineId_key" ON "PdksEvent"("offlineId");

-- CreateIndex
CREATE INDEX "PdksEvent_tenantId_userId_idx" ON "PdksEvent"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "PdksEvent_tenantId_serverTime_idx" ON "PdksEvent"("tenantId", "serverTime");

-- CreateIndex
CREATE INDEX "PdksEvent_siteId_idx" ON "PdksEvent"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "PdksIdempotency_offlineId_key" ON "PdksIdempotency"("offlineId");

-- CreateIndex
CREATE INDEX "PdksIdempotency_tenantId_userId_offlineId_idx" ON "PdksIdempotency"("tenantId", "userId", "offlineId");

-- CreateIndex
CREATE INDEX "Expense_staffId_idx" ON "Expense"("staffId");

-- CreateIndex
CREATE INDEX "Expense_companyId_idx" ON "Expense"("companyId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HelpCategory_slug_key" ON "HelpCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HelpTopic_slug_key" ON "HelpTopic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Campaign_companyId_idx" ON "Campaign"("companyId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "SalesVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteTemplate" ADD CONSTRAINT "RouteTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteTemplateStop" ADD CONSTRAINT "RouteTemplateStop_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RouteTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteTemplateStop" ADD CONSTRAINT "RouteTemplateStop_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpTopic" ADD CONSTRAINT "HelpTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_relatedHelpTopicId_fkey" FOREIGN KEY ("relatedHelpTopicId") REFERENCES "HelpTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
