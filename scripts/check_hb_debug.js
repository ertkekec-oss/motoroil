const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHB() {
    console.log("--- Hepsiburada Integration Check ---");

    // 1. Check configs
    const configs = await prisma.marketplaceConfig.findMany({
        where: { type: 'hepsiburada' }
    });
    console.log("HB Configs:", JSON.stringify(configs, null, 2));

    // 2. Check orders
    const hbOrders = await prisma.order.findMany({
        where: { marketplace: 'hepsiburada' },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Last 10 HB Orders:", hbOrders.length);
    hbOrders.forEach(o => {
        console.log(`- ${o.orderNumber} | ${o.status} | ${o.orderDate}`);
    });

    process.exit(0);
}

checkHB().catch(console.error);
