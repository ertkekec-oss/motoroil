import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findUnique({
        where: { id: 'cmltcggd10005wbbxa1yaikbo' }
    });
    if (order) {
        console.log('Order Number:', order.orderNumber);
        console.log('Shipment Package ID:', order.shipmentPackageId);
        console.log('Status:', order.status);
        console.log('Marketplace:', order.marketplace);
    } else {
        console.log('Order not found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
