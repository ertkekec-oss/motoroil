const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting decrement test...");
    const before = await prisma.customer.findUnique({ where: { id: 'cmmrpmuys000213y0pjzbt7hp' }, select: { points: true } });
    console.log("Points before:", before.points);

    await prisma.customer.update({
        where: { id: 'cmmrpmuys000213y0pjzbt7hp' },
        data: { points: { decrement: 1000 } }
    });

    const after = await prisma.customer.findUnique({ where: { id: 'cmmrpmuys000213y0pjzbt7hp' }, select: { points: true } });
    console.log("Points after:", after.points);

    // Rollback for test transparency
    await prisma.customer.update({
        where: { id: 'cmmrpmuys000213y0pjzbt7hp' },
        data: { points: { increment: 1000 } }
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
