const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const transactions = await prisma.transaction.findMany({
        where: { description: { contains: 'Komisyon Gideri' } },
        take: 5,
        orderBy: { date: 'desc' }
    });
    console.log("Found transactions:", transactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, desc: t.description })));
}
check().finally(() => prisma.$disconnect());
