const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const companies = await prisma.company.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    console.log('Recent Companies:', companies.map(c => ({ id: c.id, name: c.name })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
