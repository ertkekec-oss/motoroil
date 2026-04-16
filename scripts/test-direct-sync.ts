// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { ActionProviderRegistry } from '../src/services/marketplaces/actions/registry';

const prisma = new PrismaClient();

async function main() {
    console.log('[TEST] Init ActionProviderRegistry');
    
    const orders = await prisma.marketplaceOrder.findMany({
        where: {
            orderNumber: { in: ['11069830379', '4281248337'] }
        },
        include: { company: true }
    });
    
    console.log(`[TEST] Found ${orders.length} orders in DB`);
    
    for (const order of orders) {
        console.log(`\n============================================`);
        console.log(`[TEST] Processing ${order.marketplace} order: ${order.orderNumber}`);
        try {
            const provider = ActionProviderRegistry.getProvider(order.marketplace);
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
            console.log(`[RESULT] Success:`, result);
        } catch (err: any) {
            console.log(`[ERROR] Failed to process ${order.orderNumber}:`);
            console.error(err.message, err.stack);
            
            // Check if there is an underlying API error response
            if (err.response) {
               console.error("API Response Data:", err.response.data);
            }
        }
    }
    console.log('\n[TEST] Done.');
    process.exit(0);
}
main().catch(console.error);

