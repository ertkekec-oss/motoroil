import { ActionProviderRegistry } from '../src/services/marketplaces/actions/registry';
import prisma from '../src/lib/prisma';

async function run() {
    const order = await prisma.order.findFirst({ where: { orderNumber: '11069830379', marketplace: 'trendyol' } });
    if (!order) {
        console.log("Order not found in DB!");
        process.exit(1);
    }
    console.log("Found Trendyol order:", order.id, order.orderNumber);
    const res = await ActionProviderRegistry.getProvider('trendyol').executeAction({
        companyId: order.companyId,
        marketplace: 'trendyol',
        orderId: order.id,
        actionKey: 'SYNC_SETTLEMENT' as any,
        idempotencyKey: 'TEST_TY_' + Date.now()
    });
    console.log("Trendyol Result:", JSON.stringify(res, null, 2));

    const hbOrder = await prisma.order.findFirst({ where: { orderNumber: '4281248337', marketplace: 'hepsiburada' } });
    if (!hbOrder) {
        console.log("HB Order not found in DB!");
        process.exit(1);
    }
    console.log("Found HB order:", hbOrder.id, hbOrder.orderNumber);
    const hbRes = await ActionProviderRegistry.getProvider('hepsiburada').executeAction({
        companyId: hbOrder.companyId,
        marketplace: 'hepsiburada',
        orderId: hbOrder.id,
        actionKey: 'SYNC_SETTLEMENT' as any,
        idempotencyKey: 'TEST_HB_' + Date.now()
    });
    console.log("HB Result:", JSON.stringify(hbRes, null, 2));

    process.exit(0);
}
run();
