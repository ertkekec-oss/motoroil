import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const events = await prisma.domainEvent.findMany({
        where: { eventType: 'SALE_COMPLETED' },
        take: 5
    });
    console.log('SALE_COMPLETED Events Sample:', JSON.stringify(events, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
