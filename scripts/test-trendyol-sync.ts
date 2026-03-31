import { PrismaClient } from '@prisma/client';
import { TrendyolActionProvider } from '../src/services/marketplaces/actions/providers/trendyol-actions';

const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.marketplaceOrder.findMany({
        where: {
            orderNumber: '11069830379' 
        },
        include: { company: true }
    });
    
    for (const order of orders) {
        console.log(`[TEST] Processing ${order.marketplace} order: ${order.orderNumber}`);
        try {
            const provider = new TrendyolActionProvider();
            const result = await provider.syncSettlement(
                order.tenantId,
                order.companyId,
                order.channelId,
                {
                   orderId: order.id,
                   orderNumber: order.orderNumber,
                   marketplace: order.marketplace
                }
            );
            console.log(`[RESULT]`, JSON.stringify(result, null, 2));
        } catch (err: any) {
            console.log(`[ERROR] Failed to process ${order.orderNumber}:`, err.message);
        }
    }
    process.exit(0);
}
main().catch(console.error);
