const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function lastAudit() {
    const audits = await (prisma.marketplaceActionAudit).findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
    });

    console.log("Recent Audits:");
    audits.forEach(a => {
        console.log(`- ID: ${a.id}, Status: ${a.status}, Action: ${a.actionKey}, Created: ${a.createdAt}`);
    });

    if (audits.length > 0) {
        const fs = require('fs');
        fs.writeFileSync('last_payload.txt', JSON.stringify(audits[0].responsePayload, null, 2));
        console.log("Last payload written to last_payload.txt");
    }

    process.exit(0);
}

lastAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
