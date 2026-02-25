import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const shipments = await prisma.shipment.findMany({
            include: {
                order: {
                    select: {
                        id: true,
                        buyerCompanyId: true,
                        sellerCompanyId: true
                    }
                },
                events: {
                    orderBy: { occurredAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: { events: true }
                }
            }
        });
        console.log('OK', shipments.length);
    } catch (e) {
        console.error('ERROR', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
