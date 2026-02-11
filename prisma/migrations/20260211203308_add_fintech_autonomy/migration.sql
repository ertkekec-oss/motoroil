/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Branch_name_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isPortalActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPortalLogin" TIMESTAMP(3),
ADD COLUMN     "portalPassword" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tenantId" TEXT DEFAULT 'PLATFORM_ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "plannedTime" TIMESTAMP(3),

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesVisit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "routeStopId" TEXT,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "checkInLocation" JSONB,
    "checkOutLocation" JSONB,
    "notes" TEXT,
    "photos" TEXT[],
    "isOutOfRange" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "visitId" TEXT,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTarget" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetValue" DECIMAL(12,2) NOT NULL,
    "currentValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLayer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "quantityInitial" DECIMAL(15,4) NOT NULL,
    "quantityRemaining" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,4) NOT NULL,
    "branch" TEXT DEFAULT 'Merkez',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryConsumption" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "consumptionEventId" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitCostAtTime" DECIMAL(15,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "externalReference" TEXT,
    "companyId" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOrderFinance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(15,2) NOT NULL,
    "shippingFee" DECIMAL(15,2) NOT NULL,
    "otherFees" DECIMAL(15,2) NOT NULL,
    "netProfit" DECIMAL(15,2) NOT NULL,
    "receivableBalance" DECIMAL(15,2) NOT NULL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "lastMatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceOrderFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceSettlement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "commissionTotal" DECIMAL(15,2) NOT NULL,
    "payoutAmount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalReference" TEXT,
    "journalEntryId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTransactionLedger" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reconciliationStatus" TEXT,
    "journalEntryId" TEXT,
    "matchedBankStatementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceTransactionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankAccountCode" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL,
    "credit" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2),
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "matchedJournalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceProductPnl" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "grossRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commissionTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherFeesTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fifoCostTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "refundCostTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netProfit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "saleCount" INTEGER NOT NULL DEFAULT 0,
    "refundCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceProductPnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartPricingRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "targetMargin" DECIMAL(5,2) NOT NULL,
    "minPrice" DECIMAL(15,2) NOT NULL,
    "maxPrice" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "consentId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccountBalance" (
    "id" TEXT NOT NULL,
    "bankConnectionId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccountBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankConnectionId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "referenceNo" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAutopilotConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "minMargin" DECIMAL(5,2) NOT NULL,
    "maxDailyChangePct" DECIMAL(5,2) NOT NULL,
    "pauseOnNegativeStock" BOOLEAN NOT NULL DEFAULT true,
    "pauseOnHighReturnRate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingAutopilotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "matchType" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 100,
    "confidenceBucket" TEXT NOT NULL DEFAULT 'HIGH',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "entityName" TEXT,
    "accountCode" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashflowForecast" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "horizonDays" INTEGER NOT NULL,
    "expectedIn" DECIMAL(15,2) NOT NULL,
    "expectedOut" DECIMAL(15,2) NOT NULL,
    "netPosition" DECIMAL(15,2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashflowForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FintechAudit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "before" JSONB,
    "after" JSONB,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FintechAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_companyId_idx" ON "Route"("companyId");

-- CreateIndex
CREATE INDEX "Route_staffId_idx" ON "Route"("staffId");

-- CreateIndex
CREATE INDEX "Route_date_idx" ON "Route"("date");

-- CreateIndex
CREATE INDEX "RouteStop_routeId_idx" ON "RouteStop"("routeId");

-- CreateIndex
CREATE INDEX "RouteStop_customerId_idx" ON "RouteStop"("customerId");

-- CreateIndex
CREATE INDEX "SalesVisit_companyId_idx" ON "SalesVisit"("companyId");

-- CreateIndex
CREATE INDEX "SalesVisit_staffId_idx" ON "SalesVisit"("staffId");

-- CreateIndex
CREATE INDEX "SalesVisit_customerId_idx" ON "SalesVisit"("customerId");

-- CreateIndex
CREATE INDEX "SalesVisit_checkInTime_idx" ON "SalesVisit"("checkInTime");

-- CreateIndex
CREATE INDEX "SalesOrder_companyId_idx" ON "SalesOrder"("companyId");

-- CreateIndex
CREATE INDEX "SalesOrder_visitId_idx" ON "SalesOrder"("visitId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_orderId_idx" ON "SalesOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "StaffTarget_companyId_idx" ON "StaffTarget"("companyId");

-- CreateIndex
CREATE INDEX "DomainEvent_companyId_aggregateType_createdAt_idx" ON "DomainEvent"("companyId", "aggregateType", "createdAt");

-- CreateIndex
CREATE INDEX "DomainEvent_aggregateId_idx" ON "DomainEvent"("aggregateId");

-- CreateIndex
CREATE INDEX "InventoryLayer_productId_quantityRemaining_createdAt_idx" ON "InventoryLayer"("productId", "quantityRemaining", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryLayer_companyId_idx" ON "InventoryLayer"("companyId");

-- CreateIndex
CREATE INDEX "InventoryConsumption_layerId_idx" ON "InventoryConsumption"("layerId");

-- CreateIndex
CREATE INDEX "InventoryConsumption_consumptionEventId_idx" ON "InventoryConsumption"("consumptionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceEventId_key" ON "JournalEntry"("sourceEventId");

-- CreateIndex
CREATE INDEX "JournalEntry_companyId_date_idx" ON "JournalEntry"("companyId", "date");

-- CreateIndex
CREATE INDEX "JournalLine_accountCode_companyId_isOpen_idx" ON "JournalLine"("accountCode", "companyId", "isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceOrderFinance_orderId_key" ON "MarketplaceOrderFinance"("orderId");

-- CreateIndex
CREATE INDEX "MarketplaceOrderFinance_companyId_marketplace_idx" ON "MarketplaceOrderFinance"("companyId", "marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceSettlement_settlementId_key" ON "MarketplaceSettlement"("settlementId");

-- CreateIndex
CREATE INDEX "MarketplaceSettlement_companyId_marketplace_status_idx" ON "MarketplaceSettlement"("companyId", "marketplace", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTransactionLedger_externalReference_key" ON "MarketplaceTransactionLedger"("externalReference");

-- CreateIndex
CREATE INDEX "MarketplaceTransactionLedger_companyId_marketplace_processi_idx" ON "MarketplaceTransactionLedger"("companyId", "marketplace", "processingStatus");

-- CreateIndex
CREATE INDEX "MarketplaceTransactionLedger_externalReference_idx" ON "MarketplaceTransactionLedger"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatement_referenceNo_key" ON "BankStatement"("referenceNo");

-- CreateIndex
CREATE INDEX "BankStatement_companyId_statementDate_idx" ON "BankStatement"("companyId", "statementDate");

-- CreateIndex
CREATE INDEX "BankStatement_referenceNo_idx" ON "BankStatement"("referenceNo");

-- CreateIndex
CREATE INDEX "MarketplaceProductPnl_companyId_marketplace_idx" ON "MarketplaceProductPnl"("companyId", "marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceProductPnl_companyId_productId_marketplace_key" ON "MarketplaceProductPnl"("companyId", "productId", "marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "SmartPricingRule_companyId_productId_marketplace_key" ON "SmartPricingRule"("companyId", "productId", "marketplace");

-- CreateIndex
CREATE INDEX "BankConnection_companyId_idx" ON "BankConnection"("companyId");

-- CreateIndex
CREATE INDEX "BankTransaction_companyId_transactionDate_idx" ON "BankTransaction"("companyId", "transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_bankConnectionId_transactionId_key" ON "BankTransaction"("bankConnectionId", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingAutopilotConfig_companyId_marketplace_key" ON "PricingAutopilotConfig"("companyId", "marketplace");

-- CreateIndex
CREATE INDEX "PaymentMatch_companyId_status_idx" ON "PaymentMatch"("companyId", "status");

-- CreateIndex
CREATE INDEX "MatchingRule_companyId_pattern_idx" ON "MatchingRule"("companyId", "pattern");

-- CreateIndex
CREATE INDEX "CashflowForecast_companyId_calculatedAt_idx" ON "CashflowForecast"("companyId", "calculatedAt");

-- CreateIndex
CREATE INDEX "FintechAudit_companyId_action_idx" ON "FintechAudit"("companyId", "action");

-- CreateIndex
CREATE INDEX "FintechAudit_createdAt_idx" ON "FintechAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_name_key" ON "Branch"("companyId", "name");

-- CreateIndex
CREATE INDEX "Staff_tenantId_idx" ON "Staff"("tenantId");

-- CreateIndex
CREATE INDEX "Staff_companyId_idx" ON "Staff"("companyId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_routeStopId_fkey" FOREIGN KEY ("routeStopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "SalesVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTarget" ADD CONSTRAINT "StaffTarget_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTarget" ADD CONSTRAINT "StaffTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainEvent" ADD CONSTRAINT "DomainEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLayer" ADD CONSTRAINT "InventoryLayer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "InventoryLayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOrderFinance" ADD CONSTRAINT "MarketplaceOrderFinance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceSettlement" ADD CONSTRAINT "MarketplaceSettlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransactionLedger" ADD CONSTRAINT "MarketplaceTransactionLedger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransactionLedger" ADD CONSTRAINT "MarketplaceTransactionLedger_matchedBankStatementId_fkey" FOREIGN KEY ("matchedBankStatementId") REFERENCES "BankStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceProductPnl" ADD CONSTRAINT "MarketplaceProductPnl_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceProductPnl" ADD CONSTRAINT "MarketplaceProductPnl_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartPricingRule" ADD CONSTRAINT "SmartPricingRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartPricingRule" ADD CONSTRAINT "SmartPricingRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccountBalance" ADD CONSTRAINT "BankAccountBalance_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingAutopilotConfig" ADD CONSTRAINT "PricingAutopilotConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMatch" ADD CONSTRAINT "PaymentMatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMatch" ADD CONSTRAINT "PaymentMatch_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingRule" ADD CONSTRAINT "MatchingRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowForecast" ADD CONSTRAINT "CashflowForecast_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FintechAudit" ADD CONSTRAINT "FintechAudit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
