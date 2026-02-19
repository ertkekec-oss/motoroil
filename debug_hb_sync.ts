
import { PrismaClient } from '@prisma/client';
import { HepsiburadaService } from './src/services/marketplaces/hepsiburada';

const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        where: { orderNumber: '4323752771' }
    });

    if (!order) {
        console.log('Order not found');
        return;
    }

    const companyId = order.companyId;
    console.log('Company ID:', companyId);

    const config = await prisma.marketplaceConfig.findFirst({
        where: { companyId, type: 'hepsiburada' }
    });

    if (!config) {
        console.log('Hepsiburada config not found for this company');
        return;
    }

    console.log('Merchant ID:', config.settings.merchantId);

    const service = new HepsiburadaService(config.settings as any);

    console.log('Fetching orders from Hepsiburada...');
    const orders = await service.getOrders();
    console.log(`Fetched ${orders.length} orders total.`);

    const targetOrder = orders.find(o => o.orderNumber === '4323752771' || o.id === '4323752771');

    if (targetOrder) {
        console.log('Order found in Hepsiburada sync:');
        console.log(JSON.stringify(targetOrder, null, 2));

        // Check if _raw exists
        if ((targetOrder as any)._raw) {
            console.log('RAW DATA FROM HB:');
            console.log(JSON.stringify((targetOrder as any)._raw, null, 2));
        }
    } else {
        console.log('Order 4323752771 NOT FOUND in recent Hepsiburada sync');
        console.log('Samples of fetched orders:');
        orders.slice(0, 5).forEach(o => console.log(`${o.orderNumber} - ${o.status} - Items: ${o.items.length}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
