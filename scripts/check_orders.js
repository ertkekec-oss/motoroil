const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        take: 10
    });
    console.log('Orders found:', orders.length);
    if (orders.length > 0) {
        console.log(JSON.stringify(orders, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
