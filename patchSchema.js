const fs = require('fs');
let b = fs.readFileSync('prisma/schema.prisma');
let isUtf16 = (b[0] === 255 && b[1] === 254) || (b.length > 2 && b[1] === 0 && b[3] === 0);

let str = b.toString(isUtf16 ? 'utf16le' : 'utf8');

if (!str.includes('model ReconciliationPortalToken')) {
    let newModel = `
model ReconciliationPortalToken {
  id               String         @id @default(cuid())
  reconciliationId String
  tokenHash        String         @unique
  expiresAt        DateTime
  usedAt           DateTime?
  revokedAt        DateTime?
  createdAt        DateTime       @default(now())
  companyId        String?

  reconciliation   Reconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
}
`;

    str += newModel;

    str = str.replace(/(model Reconciliation \{[\s\S]*?)(^\})/m, (match, p1, p2) => {
        if (!p1.includes('ReconciliationPortalToken')) {
            return p1 + '  tokens           ReconciliationPortalToken[]\n' + p2;
        }
        return match;
    });

    // Prisma formatter requires valid utf8 or properly encoded files, we will write as utf8
    fs.writeFileSync('prisma/schema.prisma', str, 'utf8');
    console.log('Schema updated successfully');
} else {
    console.log('Schema already updated');
}
