const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const events = await prisma.signatureAuditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log(events);
}

main().catch(console.error).finally(() => prisma.$disconnect());
