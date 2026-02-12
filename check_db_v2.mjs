
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.order.count();
    console.log('Total Orders:', count);

    const allOrders = await prisma.order.findMany({ take: 10 });
    console.log('Sample Orders:', JSON.stringify(allOrders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
