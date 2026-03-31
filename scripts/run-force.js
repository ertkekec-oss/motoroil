const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.marketplaceOrder.findMany({
        where: {
            orderNumber: { in: ['11069830379', '4281248337'] }
        },
        include: { company: true }
    });
    
    // We already have their tenantId, companyId, and channelId.
    // Let's create an action in the DB manually using actionKey="SYNC_SETTLEMENT"
    // that the Worker will pick up and execute on the next rotation (or we can add to BullMQ)
    
    for (const o of orders) {
        console.log(`Setting up forced SYNC_SETTLEMENT for ${o.orderNumber}`);
        await prisma.marketplaceActionAudit.upsert({
            where: { idempotencyKey: `FORCE_SYNC_${o.orderNumber}_NOW` },
            update: { status: 'PENDING' },
            create: {
                tenantId: o.tenantId,
                companyId: o.companyId,
                marketplace: o.marketplace,
                orderId: o.id,
                actionKey: 'SYNC_SETTLEMENT',
                idempotencyKey: `FORCE_SYNC_${o.orderNumber}_NOW`,
                status: 'PENDING',
                requestPayload: {
                   orderId: o.id,
                   orderNumber: o.orderNumber,
                   marketplace: o.marketplace
                }
            }
        });
        
        // Push direct into BullMQ
        const { Queue } = require('bullmq');
        const queue = new Queue('marketplace-actions', { connection: { host: 'localhost', port: 6379 } });
        await queue.add('SYNC_SETTLEMENT', {
            action: 'SYNC_SETTLEMENT',
            tenantId: o.tenantId,
            companyId: o.companyId,
            channelConfigId: o.channelId,
            payload: {
                orderId: o.id,
                orderNumber: o.orderNumber,
                marketplace: o.marketplace
            }
        }, {
            jobId: `FORCE_SYNC_${o.orderNumber}_NOW`
        });
        console.log("Added to Queue!");
    }
}
main().catch(console.error);
