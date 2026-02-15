
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
    try {
        const orderNumber = '10967547692'; // From screenshot
        console.log(`Searching for order: ${orderNumber}`);

        const order = await prisma.order.findFirst({
            where: { orderNumber: orderNumber }
        });

        if (order) {
            console.log('Order found:');
            console.log(`ID: ${order.id}`);
            console.log(`Status: ${order.status}`);
            console.log(`ShipmentPackageId: ${order.shipmentPackageId} (Type: ${typeof order.shipmentPackageId})`);
            console.log(`Marketplace: ${order.marketplace}`);
            console.log(`Created At: ${order.createdAt}`);
        } else {
            console.log('Order not found!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrder();
