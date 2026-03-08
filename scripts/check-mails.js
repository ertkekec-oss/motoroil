const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.mailDeliveryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    fs.writeFileSync('mails.json', JSON.stringify(logs, null, 2), 'utf8');
    console.log("Written to mails.json");
}

main().catch(console.error).finally(() => prisma.$disconnect());
