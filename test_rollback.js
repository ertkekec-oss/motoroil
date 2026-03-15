const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const order = await prisma.order.findFirst({
        orderBy: { orderDate: 'desc' }
    });
    if (!order) {
        console.log("No orders found");
        return;
    }
    const transactions = await prisma.transaction.findMany({
        where: { description: { contains: `REF:${order.id}` } }
    });
    console.log("Order ID:", order.id);
    console.log("Found transactions:", transactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, desc: t.description })));
}
check().finally(() => prisma.$disconnect());
