
const { PrismaClient } = require('@prisma/client');
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
    console.log('Username:', config.settings.username);

    // Use the service directly to fetch
    const { HepsiburadaService } = require('./src/services/marketplaces/hepsiburada');
    const service = new HepsiburadaService(config.settings);

    // Try to sync and see what happens to this specific order
    // Actually, let's just fetch the raw data for this order using the service's internal fetch logic if possible
    // Or just call fetchOrders and look for this order

    console.log('Fetching orders from Hepsiburada...');
    const orders = await service.fetchOrders();
    const targetOrder = orders.find(o => o.orderNumber === '4323752771' || o.id === '4323752771');

    if (targetOrder) {
        console.log('Order found in Hepsiburada sync:');
        console.log(JSON.stringify(targetOrder, null, 2));
    } else {
        console.log('Order 4323752771 NOT FOUND in recent Hepsiburada sync');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
