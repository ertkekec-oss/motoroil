
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        where: { orderNumber: '4323752771' }
    });

    if (order) {
        console.log('Order:', order.orderNumber);
        console.log('Items Raw:', order.items);
        console.log('Items Type:', typeof order.items);
        console.log('Is Array:', Array.isArray(order.items));
        if (Array.isArray(order.items)) console.log('Length:', order.items.length);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
