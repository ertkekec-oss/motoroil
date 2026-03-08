const fs = require('fs');
const content = `

// --- UNIFIED TRADE LEDGER ---

model TradeLedgerEntry {
  id                String   @id @default(cuid())
  tenantId          String?
  buyerTenantId     String?
  sellerTenantId    String?
  canonicalProductId String?
  productId         String?
  opportunityId     String?
  proposalId        String?
  contractId        String?
  escrowId          String?
  shipmentId        String?
  disputeId         String?
  eventType         String
  eventStatus       String?
  amount            Float?
  quantity          Float?
  currency          String?
  metadataJson      Json?
  sourceType        String?
  sourceRef         String?
  occurredAt        DateTime @default(now())
  createdAt         DateTime @default(now())

  @@index([buyerTenantId])
  @@index([sellerTenantId])
  @@index([eventType])
  @@index([occurredAt])
}

model TradeLedgerLink {
  id                String   @id @default(cuid())
  ledgerEntryId     String
  linkedEntityType  String
  linkedEntityId    String
  createdAt         DateTime @default(now())

  @@index([ledgerEntryId])
  @@index([linkedEntityType, linkedEntityId])
}

// --- NETWORK GROWTH ENGINE ---

model NetworkGrowthTrigger {
  id                  String   @id @default(cuid())
  tenantId            String?
  buyerTenantId       String?
  sellerTenantId      String?
  canonicalProductId  String?
  triggerType         String
  triggerStrength     Float
  status              String   @default("OPEN")
  metadataJson        Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([tenantId, status])
  @@index([canonicalProductId])
  @@index([triggerType])
}

model NetworkGrowthAction {
  id                  String   @id @default(cuid())
  triggerId           String
  actionType          String
  targetType          String?
  targetRef           String?
  status              String   @default("PENDING")
  payloadJson         Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([triggerId])
  @@index([status])
}
`;

fs.appendFileSync('prisma/schema.prisma', content);
console.log('Appended to schema');
