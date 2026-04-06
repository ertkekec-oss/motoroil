const fs = require('fs');
let buf = fs.readFileSync('prisma/schema.prisma');
let content = buf.toString('utf8');

// Find the start of CmsSetting
const startIdx = content.lastIndexOf('model CmsSetting');
if (startIdx !== -1) {
    let clean = content.substring(0, startIdx);
    clean += `model CmsSetting {
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
    // convert back to standard CRLF if needed, or just write
    fs.writeFileSync('prisma/schema.prisma', clean);
    console.log("SUCCESS!");
} else {
    console.log("FAILED TO FIND");
}
