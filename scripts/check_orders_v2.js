const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // We already know adasda has a trendyol config.
    // Let's see if we can trigger the sync logic manually or just simulate it.

    // Actually, I'll just check for orders again to be 100% sure.
    const count = await prisma.order.count();
    console.log('Total Orders in DB:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
