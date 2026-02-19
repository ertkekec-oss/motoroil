
import { PrismaClient } from '@prisma/client';
import { HepsiburadaService } from './src/services/marketplaces/hepsiburada';

const prisma = new PrismaClient();

async function main() {
    const orderNumber = '4323752771';
    const order = await prisma.order.findFirst({ where: { orderNumber } });
    if (!order) return;
    const config = await prisma.marketplaceConfig.findFirst({ where: { companyId: order.companyId, type: 'hepsiburada' } });
    if (!config) return;
    const service = new HepsiburadaService(config.settings as any);

    const orders = await service.getOrders();
    const target = orders.find(o => o.orderNumber === orderNumber);

    if (target) {
        console.log('--- FOUND ORDER ---');
        console.log('Order Number:', target.orderNumber);
        // @ts-ignore
        const raw = target._raw;
        if (raw && raw.items && raw.items.length > 0) {
            console.log('RAW FIRST ITEM:', JSON.stringify(raw.items[0], null, 2));
        } else if (raw) {
            console.log('RAW KEYS:', Object.keys(raw));
            console.log('RAW ITEMS FIELD:', raw.items);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
