const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (!schemaContent.includes('model Envelope')) {
  const modelsToAdd = `
// CONTRACTS MVP ENUMS
enum TemplateStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum TemplateEngine {
  HTML
  PDF_FORM
}

enum DocumentStatus {
  DRAFT
  PENDING_SIGN
  COMPLETED
  VOID
}

enum DocumentSource {
  TEMPLATE
  UPLOAD
  API
}

enum EnvelopeStatus {
  DRAFT
  SENT
  DELIVERED
  COMPLETED
  DECLINED
  VOIDED
}

enum RecipientStatus {
  CREATED
  SENT
  DELIVERED
  OTP_VERIFIED
  SIGNED
  DECLINED
}

enum RecipientRole {
  SIGNER
  CC
  APPROVER
}

enum AuthMethod {
  NONE
  EMAIL_OTP
  SMS_OTP
}

enum ContractAuditAction {
  CREATED
  UPDATED
  SENT
  DELIVERED
  OTP_REQUESTED
  OTP_VERIFIED
  SIGNED
  DECLINED
  COMPLETED
  VOIDED
  DOWNLOADED
}

enum ContractActorType {
  SYSTEM
  USER
  RECIPIENT
}

// CONTRACTS MVP MODELS
model FileBlob {
  id        String   @id @default(cuid())
  tenantId  String
  s3Key     String
  fileHash  String
  fileSize  Int
  fileType  String
  createdAt DateTime @default(now())

  documents DocumentVersion[]

  @@index([tenantId])
}

model DocumentTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  engine      TemplateEngine @default(HTML)
  status      TemplateStatus @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  versions TemplateVersion[]

  @@index([tenantId])
}

model TemplateVersion {
  id          String   @id @default(cuid())
  templateId  String
  version     Int
  tenantId    String
  bodyContent String
  createdAt   DateTime @default(now())

  template DocumentTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  documents Document[]

  @@unique([templateId, version])
  @@index([tenantId])
}

model Document {
  id                String   @id @default(cuid())
  tenantId          String
  subject           String
  source            DocumentSource @default(TEMPLATE)
  status            DocumentStatus @default(DRAFT)
  templateVersionId String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  templateVersion TemplateVersion?  @relation(fields: [templateVersionId], references: [id])
  versions        DocumentVersion[]
  envelopes       Envelope[]

  @@index([tenantId])
}

model DocumentVersion {
  id              String   @id @default(cuid())
  documentId      String
  version         Int
  tenantId        String
  fileBlobId      String?
  bodySnapshot    String?
  createdAt       DateTime @default(now())

  document Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  fileBlob FileBlob? @relation(fields: [fileBlobId], references: [id])
  envelopes Envelope[]

  @@unique([documentId, version])
  @@index([tenantId])
}

model Envelope {
  id                String   @id @default(cuid())
  tenantId          String
  documentId        String
  documentVersionId String
  status            EnvelopeStatus @default(DRAFT)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  document        Document        @relation(fields: [documentId], references: [id])
  documentVersion DocumentVersion @relation(fields: [documentVersionId], references: [id])
  recipients      Recipient[]
  auditEvents     ContractAuditEvent[]

  @@index([tenantId])
}

model Recipient {
  id         String   @id @default(cuid())
  tenantId   String
  envelopeId String
  email      String
  name       String
  role       RecipientRole @default(SIGNER)
  status     RecipientStatus @default(CREATED)
  orderIndex Int      @default(1)
  authMethod AuthMethod @default(NONE)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  envelope       Envelope         @relation(fields: [envelopeId], references: [id], onDelete: Cascade)
  signingSession SigningSession?
  auditEvents    ContractAuditEvent[]

  @@index([envelopeId, orderIndex])
  @@index([tenantId])
}

model SigningSession {
  id              String   @id @default(cuid())
  tenantId        String
  recipientId     String   @unique
  publicTokenHash String   @unique
  expiresAt       DateTime
  otpState        Json?
  attemptCount    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  recipient Recipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model SignatureProviderConfig {
  id                   String   @id @default(cuid())
  tenantId             String
  providerKey          String
  credentialsEncrypted String
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([tenantId, providerKey])
  @@index([tenantId])
}

model WebhookInbox {
  id        String   @id @default(cuid())
  tenantId  String
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([tenantId])
}

model ContractAuditEvent {
  id          String   @id @default(cuid())
  tenantId    String
  envelopeId  String?
  recipientId String?
  actorType   ContractActorType
  actorId     String?
  action      ContractAuditAction
  ip          String?
  userAgent   String?
  meta        Json?
  createdAt   DateTime @default(now())

  envelope  Envelope?  @relation(fields: [envelopeId], references: [id])
  recipient Recipient? @relation(fields: [recipientId], references: [id])

  @@index([envelopeId, createdAt])
  @@index([tenantId])
}

model HashLedger {
  id              String   @id @default(cuid())
  tenantId        String
  targetType      String
  targetId        String
  hashValue       String
  previousHash    String?
  createdAt       DateTime @default(now())

  @@index([tenantId])
  @@index([targetType, targetId])
}
`;
  fs.appendFileSync(schemaPath, modelsToAdd);
  console.log("Schema appended successfully");
} else {
  console.log("Schema already appended");
}
