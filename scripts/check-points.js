const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cust = await prisma.customer.findUnique({
        where: { id: 'cmmrpmuys000213y0pjzbt7hp' },
        select: { id: true, name: true, points: true }
    });
    console.log(cust);
}

main().catch(console.error).finally(() => prisma.$disconnect());
