const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const configs = await prisma.marketplaceConfig.findMany({
        where: { companyId: 'cmlsmhyap000e8fcnemogl9hn' }
    });
    console.log(JSON.stringify(configs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
