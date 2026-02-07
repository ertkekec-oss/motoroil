
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'PLATFORM_ADMIN';
    const sub = await (prisma as any).subscription.findUnique({
        where: { tenantId }
    });
    console.log(`Subscription for ${tenantId}:`, sub);

    const allSubs = await (prisma as any).subscription.findMany({
        include: { plan: true }
    });
    console.log('All Subscriptions:', JSON.stringify(allSubs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
