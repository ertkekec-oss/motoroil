const fs = require('fs');

let code = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Add relation to Tenant
if (!code.includes('cmsSites CmsSite[]')) {
    code = code.replace(/model Tenant \{/, 'model Tenant {\n  cmsSites CmsSite[]');
}

// Remove old models
code = code.replace(/model CmsPage \{.*?\n\}/s, '');
code = code.replace(/model CmsSection \{.*?\n\}/s, '');
code = code.replace(/model CmsMenu \{.*?\n\}/s, '');
code = code.replace(/model CmsGeneralSettings \{.*?\n\}/s, '');

const newModels = `

// --- LEVEL 10 ADVANCED CMS ENGINE ---

model CmsSite {
  id              String      @id @default(cuid())
  tenantId        String?     // Null for global Periodya main site, uuid for B2B storefronts
  domain          String      @unique
  name            String
  defaultLanguage String      @default("tr")
  supportedLangs  String[]    @default(["tr", "en"])
  settings        Json?       // Global theme tokens, SEO defaults
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  pages           CmsPageV2[]
  tenant          Tenant?     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
}

model CmsPageV2 {
  id              String        @id @default(cuid())
  siteId          String
  slug            String        // unique per site
  locale          String        @default("tr") // for i18n
  title           String
  metaDescription String?
  ogImage         String?
  status          String        @default("DRAFT") // DRAFT, REVIEW, PUBLISHED, ARCHIVED
  version         Int           @default(1)
  config          Json?         // Page specific settings (e.g. transparent header, password protected)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  publishedBy     String?
  site            CmsSite       @relation(fields: [siteId], references: [id], onDelete: Cascade)
  blocks          CmsBlock[]
  revisions       CmsRevision[]

  @@unique([siteId, slug, locale])
  @@index([siteId, status])
}

model CmsBlock {
  id                   String    @id @default(cuid())
  pageId               String
  type                 String    // e.g. "Hero", "PricingGrid", "FeatureList"
  order                Int       @default(0)
  content              Json      // Multi-variant content goes here: { base: {...}, segment_logistics: {...} }
  personalizationRules Json?     // A/B testing splits or segment conditions
  isActive             Boolean   @default(true)
  page                 CmsPageV2 @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, order])
}

model CmsRevision {
  id          String    @id @default(cuid())
  pageId      String
  version     Int
  snapshot    Json      // The entire page state (blocks, meta) at this version
  authorId    String?
  commitMsg   String?
  createdAt   DateTime  @default(now())
  page        CmsPageV2 @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, version])
}

model CmsSegment {
  id          String   @id @default(cuid())
  name        String   // "Logistics Firm", "High-Risk Merchant"
  rules       Json     // conditions to match
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CmsAbTest {
  id          String   @id @default(cuid())
  name        String
  blockId     String
  variants    Json     // { A: "...", B: "..." }
  metrics     Json     // { A_views: 100, A_clicks: 10, B_views: ... }
  status      String   @default("ACTIVE") // ACTIVE, CONCLUDED
  winner      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([blockId])
}
`;

if (!code.includes('CmsSite {')) {
    code += newModels;
}

fs.writeFileSync('prisma/schema.prisma', code);
console.log('Advanced CMS schema injected!');
