
import { PrismaClient } from '@prisma/client';
import { HepsiburadaService } from './src/services/marketplaces/hepsiburada';

const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        where: { orderNumber: '4323752771' }
    });

    if (!order) return;
    const config = await prisma.marketplaceConfig.findFirst({
        where: { companyId: order.companyId, type: 'hepsiburada' }
    });

    if (!config) return;
    const service = new HepsiburadaService(config.settings as any);

    // Call getOrders and find our specific order
    const orders = await service.getOrders();
    const target = orders.find(o => o.orderNumber === '4323752771');

    if (target) {
        console.log('--- FOUND ORDER ---');
        console.log('Order Number:', target.orderNumber);
        console.log('Status:', target.status);
        console.log('Items Count:', target.items.length);
        if (target.items.length > 0) {
            console.log('First Item:', JSON.stringify(target.items[0], null, 2));
        }
        // @ts-ignore
        if (target._raw) {
            console.log('RAW Keys:', Object.keys(target._raw));
            // Check for common item keys in raw
            // @ts-ignore
            const raw = target._raw;
            console.log('Raw items:', !!raw.items, 'Raw lines:', !!raw.lines, 'Raw orderLines:', !!raw.orderLines);
        }
    } else {
        console.log('Order not found in sync');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
