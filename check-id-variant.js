const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const id = 'cmlsmhyap000e8fcnemogl9hn'; // With L
    const id2 = 'cmlsmhyap000e8fcnemog19hn'; // With 1

    const c1 = await prisma.company.findUnique({ where: { id } });
    const c2 = await prisma.company.findUnique({ where: { id: id2 } });

    console.log('ID with L foundation:', !!c1);
    console.log('ID with 1 foundation:', !!c2);

    if (c2) {
        const configs = await prisma.marketplaceConfig.findMany({ where: { companyId: id2 } });
        console.log('Configs for ID with 1:', configs.map(c => c.type));
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
