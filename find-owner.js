const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findOwner() {
    console.log('Searching for Pazarama orders and their companies...');

    const orders = await prisma.order.findMany({
        where: { marketplace: 'Pazarama' },
        select: { companyId: true, orderNumber: true },
        take: 5
    });

    console.log('Pazarama Orders found (Samples):', JSON.stringify(orders, null, 2));

    const companyIds = [...new Set(orders.map(o => o.companyId))];

    console.log('Unique Company IDs in Pazarama orders:', companyIds);

    for (const id of companyIds) {
        const configs = await prisma.marketplaceConfig.findMany({
            where: { companyId: id }
        });
        console.log(`Configs for Company ${id}:`, JSON.stringify(configs, null, 2));
    }
}

findOwner()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
