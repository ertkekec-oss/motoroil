import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sales = await prisma.order.findMany({
        where: {
            marketplace: 'POS',
            orderDate: { gte: today }
        },
        orderBy: { orderDate: 'desc' },
        take: 5
    });
    console.log("Bugünkü satışlar:", JSON.stringify(sales, null, 2));

    const transactions = await prisma.transaction.findMany({
        where: {
            type: 'Sales',
            date: { gte: today }
        },
        orderBy: { date: 'desc' },
        take: 5
    });
    console.log("Bugünkü Transactionlar:", JSON.stringify(transactions, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
