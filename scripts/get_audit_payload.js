const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAudit() {
    const auditId = 'cmlob15zn0029wlicgzrpoc9';
    const audit = await prisma.marketplaceActionAudit.findUnique({
        where: { id: auditId }
    });

    if (!audit) {
        console.log(`Audit with ID ${auditId} not found.`);
        process.exit(0);
    }

    const payload = audit.responsePayload;
    const fs = require('fs');
    fs.writeFileSync('payload_dump.txt', JSON.stringify(audit.responsePayload, null, 2));
    console.log("PAYLOAD_WRITTEN_TO_FILE");

    process.exit(0);
}

checkAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
