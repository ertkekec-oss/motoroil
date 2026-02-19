const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const companies = await prisma.company.findMany({
        where: { name: { contains: 'kech', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(companies, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
