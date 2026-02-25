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

txt += `

enum RfqStatus {
  DRAFT
  SENT
  RESPONDED
  ACCEPTED
  EXPIRED
  CANCELLED
}

enum OfferStatus {
  PENDING
  COUNTERED
  ACCEPTED
  REJECTED
}

model Rfq {
  id             String      @id @default(cuid())
  buyerCompanyId String
  status         RfqStatus   @default(DRAFT)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  items          RfqItem[]
  offers         SellerOffer[]

  @@index([buyerCompanyId])
  @@index([status])
}

model RfqItem {
  id              String   @id @default(cuid())
  rfqId           String
  productId       String
  sellerCompanyId String
  quantity        Int
  targetPrice     Decimal? @db.Decimal(12, 2)

  rfq Rfq @relation(fields: [rfqId], references: [id], onDelete: Cascade)

  @@index([rfqId])
  @@index([sellerCompanyId])
}

model SellerOffer {
  id              String      @id @default(cuid())
  rfqId           String
  sellerCompanyId String
  status          OfferStatus @default(PENDING)
  totalPrice      Decimal     @db.Decimal(12, 2)
  expiresAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  rfq   Rfq               @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  items SellerOfferItem[]

  @@index([rfqId])
  @@index([sellerCompanyId])
  @@index([status])
}

model SellerOfferItem {
  id            String      @id @default(cuid())
  sellerOfferId String
  productId     String
  quantity      Int
  unitPrice     Decimal     @db.Decimal(12, 2)

  sellerOffer SellerOffer @relation(fields: [sellerOfferId], references: [id], onDelete: Cascade)

  @@index([sellerOfferId])
}
`;

fs.writeFileSync('prisma/schema.prisma', txt, 'utf8');
console.log('Done mapping schema.');
