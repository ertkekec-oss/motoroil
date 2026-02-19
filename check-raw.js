const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRaw() {
    console.log('Fetching rawData of a Pazarama order...');

    const order = await prisma.order.findFirst({
        where: { marketplace: 'Pazarama' },
        orderBy: { createdAt: 'desc' }
    });

    if (order) {
        console.log('Order Number:', order.orderNumber);
        console.log('Items in DB:', JSON.stringify(order.items, null, 2));
        console.log('Raw Data keys:', Object.keys(order.rawData || {}));
        if (order.rawData) {
            console.log('Raw Items:', JSON.stringify(order.rawData.items || order.rawData.orderItems || order.rawData.orderItemDetails, null, 2));
        }
    } else {
        console.log('No Pazarama order found.');
    }
}

checkRaw()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
