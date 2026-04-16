// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

const prisma = new PrismaClient();
const queue = new Queue('marketplace-actions', { connection: { host: 'localhost', port: 6379 } });

async function main() {
    const orders = await prisma.marketplaceOrder.findMany({
        where: {
            orderNumber: { in: ['11069830379', '4281248337'] }
        },
        include: { company: true }
    });
    
    console.log(`Found ${orders.length} orders in DB`);
    
    for (const order of orders) {
        console.log(`Queueing ${order.orderNumber} for SYNC_SETTLEMENT`);
        await queue.add('SYNC_SETTLEMENT', {
            action: 'SYNC_SETTLEMENT',
            tenantId: order.tenantId,
            companyId: order.companyId,
            channelConfigId: order.channelId,
            payload: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                marketplace: order.marketplace
            }
        }, {
            jobId: `TEST_SYNC_${order.orderNumber}_${Date.now()}`
        });
    }
    console.log('Jobs added. Check the worker output!');
    process.exit(0);
}
main().catch(console.error);

