const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const e = await prisma.signatureEnvelope.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log(e.documentKey);
}

main().catch(console.error).finally(() => prisma.$disconnect());
