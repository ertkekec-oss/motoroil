const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (schema.includes('model Asset {')) {
    console.log('Assets already exist in schema.');
    process.exit(0);
}

// 1. Add Asset[] to model Company
schema = schema.replace(
    /(model Company\s*\{[\s\S]*?)(\s*)(@@unique|@@index|})/g,
    (match, p1, p2, p3) => {
        if (p1.includes('assets ')) return match;
        return `${p1}  assets                     Asset[]\n${p2}${p3}`;
    }
);

// 2. Add assetAssignments to model Staff
schema = schema.replace(
    /(model Staff\s*\{[\s\S]*?)(\s*)(@@unique|@@index|})/g,
    (match, p1, p2, p3) => {
        if (p1.includes('assetAssignments ')) return match;
        return `${p1}  assetAssignments         AssetAssignment[]\n${p2}${p3}`;
    }
);

// 3. Append new models
const newModels = `

// -------------------------------------------------------------
// Demirbaş & Zimmet Modülü (Asset Management)
// -------------------------------------------------------------

model Asset {
  id              String            @id @default(cuid())
  companyId       String
  branch          String?
  name            String
  category        String            @default("Elektronik")
  serialNumber    String?
  barcode         String?           @unique
  purchaseDate    DateTime?
  purchasePrice   Float?
  depreciation    Float?
  status          String            @default("ACTIVE")
  assignedTo      String?

  company         Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  assignments     AssetAssignment[]
  maintenances    AssetMaintenance[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([companyId])
}

model AssetAssignment {
  id              String            @id @default(cuid())
  companyId       String
  assetId         String
  staffId         String
  assignedAt      DateTime          @default(now())
  returnedAt      DateTime?
  status          String            @default("ACTIVE")
  notes           String?
  signatureDocId  String?
  isSigned        Boolean           @default(false)

  asset           Asset             @relation(fields: [assetId], references: [id], onDelete: Cascade)
  staff           Staff             @relation(fields: [staffId], references: [id], onDelete: Cascade)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([companyId])
  @@index([assetId])
  @@index([staffId])
}

model AssetMaintenance {
  id              String            @id @default(cuid())
  companyId       String
  assetId         String
  maintenanceDate DateTime          @default(now())
  type            String            @default("REPAIR")
  cost            Float             @default(0)
  description     String?
  supplierId      String?
  invoiceRef      String?

  asset           Asset             @relation(fields: [assetId], references: [id], onDelete: Cascade)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([companyId])
  @@index([assetId])
}
`;

schema += newModels;

fs.writeFileSync(schemaPath, schema);
console.log('Schema patched successfully.');
