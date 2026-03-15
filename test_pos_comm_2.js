const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    const transactions = await prisma.transaction.findMany({
        where: { description: { contains: 'Komisyon Gideri' } },
        take: 5,
        orderBy: { date: 'desc' }
    });
    for(const t of transactions) console.log(JSON.stringify(t.description));
}
check().finally(() => prisma.$disconnect());
