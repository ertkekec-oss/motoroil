
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const summary = await prisma.order.groupBy({
        by: ['marketplace', 'status'],
        _count: true,
    });
    console.log(JSON.stringify(summary, null, 2));

    const recent = await prisma.order.findMany({
        where: { marketplace: { not: 'POS' } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('Recent Non-POS Orders:', JSON.stringify(recent, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
