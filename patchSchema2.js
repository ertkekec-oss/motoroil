const fs = require('fs');
let str = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!str.includes('ReconciliationDisputeStatus')) {
    let newModel = `
enum ReconciliationDisputeStatus {
  OPEN
  RESOLVED
  REJECTED
}

model ReconciliationDispute {
  id               String         @id @default(cuid())
  tenantId         String
  reconciliationId String
  companyId        String?
  message          String
  status           ReconciliationDisputeStatus @default(OPEN)
  attachmentKey    String?
  attachmentUrl    String?
  createdAt        DateTime       @default(now())

  reconciliation   Reconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
}
`;
    str += newModel;

    str = str.replace(/(model Reconciliation \{[\s\S]*?)(^\})/m, (match, p1, p2) => {
        if (!p1.includes('ReconciliationDispute')) {
            return p1 + '  disputes         ReconciliationDispute[]\n' + p2;
        }
        return match;
    });

    fs.writeFileSync('prisma/schema.prisma', str, 'utf8');
    console.log('Schema updated successfully');
} else {
    console.log('Schema already updated');
}
