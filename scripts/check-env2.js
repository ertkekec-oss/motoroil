const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const s = await prisma.signatureSession.findMany({
        where: { recipient: { email: { contains: 'oilshoptr' } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { envelope: { include: { recipients: { orderBy: { orderIndex: 'asc' } } } }, recipient: true }
    });
    fs.writeFileSync('env2.json', JSON.stringify(s, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());
