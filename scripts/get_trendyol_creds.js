const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCredentials() {
    const configs = await prisma.marketplaceConfig.findMany({
        where: { type: 'TRENDYOL' }
    });
    console.log(JSON.stringify(configs, null, 2));
}

getCredentials().catch(console.error).finally(() => prisma.$disconnect());
