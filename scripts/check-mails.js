const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.mailDeliveryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    fs.writeFileSync('mail_check.json', JSON.stringify(logs, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());
