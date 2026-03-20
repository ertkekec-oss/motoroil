const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const ediz = await prisma.customer.findFirst({ where: { name: { contains: 'EDİZ', mode: 'insensitive' } } });
    console.log("EDIZ deletedAt:", ediz?.deletedAt);
    prisma.$disconnect();
}
check();
