const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

const strToFind = 'model CmsPage'
const idx = c.lastIndexOf(strToFind);
if(idx !== -1) {
    c = c.substring(0, idx);
    c += `model CmsSetting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  description String?
  updatedAt   DateTime @updatedAt
}

model SystemIntegration {
  id              String   @id @default(cuid())
  category        String
  providerCode    String
  name            String
  isActive        Boolean  @default(false)
  isGlobalDefault Boolean  @default(false)
  credentials     Json
  settings        Json?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([category, providerCode])
}
`;
    fs.writeFileSync('prisma/schema.prisma', c, 'utf8');
    console.log("Cleaned and updated schema.prisma!!");
} else {
    console.log("Could not find the target string...");
}
