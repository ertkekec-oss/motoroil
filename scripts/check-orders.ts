import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const orders = await prisma.order.findMany({
        select: { id: true, marketplace: true, orderNumber: true },
        take: 20,
        orderBy: { orderDate: 'desc' }
    });
    console.log("Found orders:", orders.length);
    if(orders.length > 0) {
        console.log(orders.map(o => o.marketplace));
    }
}
run().finally(() => prisma.$disconnect());
