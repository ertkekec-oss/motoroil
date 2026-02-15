const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCompany() {
    const company = await prisma.company.findFirst({
        where: { name: 'Periodya Platform' }
    });
    console.log(`Company ID: ${company?.id}`);
}

getCompany().catch(console.error).finally(() => prisma.$disconnect());
