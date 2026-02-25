const fs = require('fs');
let b = fs.readFileSync('prisma/schema.prisma');
let txt = '';
if (b[0] === 0xff && b[1] === 0xfe) {
    txt = b.toString('utf16le');
} else if (b[0] === 0xfe && b[1] === 0xff) {
    txt = b.toString('utf16be');
} else {
    txt = b.toString('utf8');
}

// Add sourceType and sourceId to NetworkOrder
if (!txt.includes('sourceType')) {
    txt = txt.replace(
        'model NetworkOrder {',
        'model NetworkOrder {\n  sourceType     OrderSourceType @default(CART)\n  sourceId       String?'
    );
}

txt += `
enum ContractStatus {
  DRAFT
  ACTIVE
  SUSPENDED
  EXPIRED
}

enum SettlementCycle {
  INSTANT
  WEEKLY
  MONTHLY
}

enum RecurringFrequency {
  WEEKLY
  MONTHLY
}

enum OrderSourceType {
  CART
  RFQ
  CONTRACT
}

model Contract {
  id              String          @id @default(cuid())
  buyerCompanyId  String
  sellerCompanyId String
  status          ContractStatus  @default(DRAFT)
  startDate       DateTime?
  endDate         DateTime?
  currency        String          @default("TRY")
  paymentMode     PaymentMode     @default(DIRECT)
  settlementCycle SettlementCycle @default(INSTANT)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  items           ContractItem[]
  slas            ContractSLA[]
  recurringOrders RecurringOrder[]

  @@index([buyerCompanyId])
  @@index([sellerCompanyId])
  @@index([status])
}

model ContractItem {
  id            String         @id @default(cuid())
  contractId    String
  productId     String
  baseUnitPrice Decimal        @db.Decimal(12, 2)
  minOrderQty   Int            @default(1)

  contract      Contract       @relation(fields: [contractId], references: [id], onDelete: Cascade)
  tiers         ContractTier[]
  reservedStock ReservedStock?

  @@index([contractId])
  @@index([productId])
}

model ContractTier {
  id             String       @id @default(cuid())
  contractItemId String
  minQty         Int
  unitPrice      Decimal      @db.Decimal(12, 2)

  contractItem   ContractItem @relation(fields: [contractItemId], references: [id], onDelete: Cascade)

  @@index([contractItemId])
}

model ReservedStock {
  id             String       @id @default(cuid())
  contractItemId String       @unique
  quantity       Int          @default(0)
  allocated      Int          @default(0)

  contractItem   ContractItem @relation(fields: [contractItemId], references: [id], onDelete: Cascade)
}

model ContractSLA {
  id                 String   @id @default(cuid())
  contractId         String
  maxDeliveryDays    Int
  latePenaltyPercent Decimal  @db.Decimal(5, 2)

  contract           Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)

  @@index([contractId])
}

model RecurringOrder {
  id          String             @id @default(cuid())
  contractId  String
  frequency   RecurringFrequency
  dayOfPeriod Int
  nextRunAt   DateTime?
  active      Boolean            @default(true)

  contract    Contract           @relation(fields: [contractId], references: [id], onDelete: Cascade)

  @@index([contractId])
  @@index([nextRunAt])
}

model PenaltyLedger {
  id              String   @id @default(cuid())
  sellerCompanyId String
  contractId      String
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("TRY")
  createdAt       DateTime @default(now())

  @@index([sellerCompanyId])
  @@index([contractId])
}
`;

fs.writeFileSync('prisma/schema.prisma', txt, 'utf8');
console.log('Appended PROMPT 13 schemas.');
