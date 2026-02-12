import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pnlCount = await prisma.marketplaceProductPnl.count();
    console.log('Total P&L records:', pnlCount);

    const pnlSamples = await prisma.marketplaceProductPnl.findMany({
        take: 5
    });
    console.log('Sample P&L records:', JSON.stringify(pnlSamples, null, 2));

    const events = await prisma.domainEvent.count();
    console.log('Total DomainEvents:', events);

    const eventTypes = await prisma.domainEvent.groupBy({
        by: ['eventType'],
        _count: { id: true }
    });
    console.log('Event Types distribution:', JSON.stringify(eventTypes, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
