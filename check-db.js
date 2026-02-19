const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
    const companyId = 'cmlsmhyap000e8fcnemog19hn';
    console.log(`Checking MarketplaceConfig for Company: ${companyId}`);

    const configs = await prisma.marketplaceConfig.findMany({
        where: { companyId }
    });

    console.log('Configs found:', JSON.stringify(configs, null, 2));

    const orders = await prisma.order.findMany({
        where: { companyId, marketplace: 'Pazarama' },
        take: 1
    });

    console.log('Recent Pazarama order for this company:', JSON.stringify(orders, null, 2));
}

checkConfig()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
