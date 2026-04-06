const fs = require('fs');
const content = `

// ==========================================
// CMS & LANDING PAGE ARCHITECTURE
// ==========================================

model CmsPage {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  content     Json     // TipTap/Block editor content 
  excerpt     String?
  seoTitle    String?
  seoDesc     String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  authorId    String?  // Reference to User if needed
}

model CmsSetting {
  id          String   @id @default(uuid())
  key         String   @unique // e.g., 'landing_hero', 'landing_integrations'
  value       Json     // structured data for this block
  description String?
  updatedAt   DateTime @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', content);
console.log('CMS Models appended successfully.');
