import prisma from '../src/lib/prisma';

async function run() {
    const orders = await prisma.order.findMany({
        where: { orderNumber: { in: ['4319156565', '4480163364'] } },
        select: { orderNumber: true, customerName: true, totalAmount: true, status: true, orderDate: true, items: true, createdAt: true, updatedAt: true }
    });
    
    orders.forEach(o => {
        console.log(`Order: ${o.orderNumber}`);
        console.log(`  Name: ${o.customerName}`);
        console.log(`  Date: ${o.orderDate.toISOString()}`);
        console.log(`  Status: ${o.status}`);
        console.log(`  Total: ${o.totalAmount}`);
        console.log(`  Items length: ${(o.items as any)?.length}`);
    });
}
run();
