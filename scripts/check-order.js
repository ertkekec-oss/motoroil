const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const o = await prisma.order.findFirst({ where: { orderNumber: '4781167382' } });
    console.log(JSON.stringify(o, null, 2));
}
run().finally(() => prisma.$disconnect());
