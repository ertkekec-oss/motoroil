import { PrismaClient } from '@prisma/client';
import { ActionProviderRegistry } from '../src/services/marketplaces/actions/registry';

const prisma = new PrismaClient();

async function run() {
    console.log("=== BÜYÜK MUTABAKAT TESTİ (GRAND SETTLEMENT TEST) ===");

    // 1. Find a Trendyol Order
    const tyOrder = await prisma.order.findFirst({
        where: { marketplace: 'trendyol' },
        orderBy: { orderDate: 'desc' }
    });

    if (tyOrder) {
        console.log(`\n[TEST] 1 Adet Trendyol Siparişi Bulundu: ${tyOrder.orderNumber}. Mutabakat Çekiliyor...`);
        const tyProvider = ActionProviderRegistry.getProvider('trendyol');
        const res1 = await tyProvider.executeAction({
            companyId: tyOrder.companyId,
            marketplace: 'trendyol',
            orderId: tyOrder.id,
            actionKey: 'SYNC_SETTLEMENT' as any,
            idempotencyKey: `SIMULATION_TY_${tyOrder.id}`
        });
        console.log("Trendyol Çevirmen (Adapter) Sonucu:", res1);
    } else {
        console.log(`\n[UYARI] Trendyol siparişi bulunamadı.`);
    }

    // 2. Find a Hepsiburada Order
    const hbOrder = await prisma.order.findFirst({
        where: { marketplace: 'hepsiburada' },
        orderBy: { orderDate: 'desc' }
    });

    if (hbOrder) {
        console.log(`\n[TEST] 1 Adet Hepsiburada Siparişi Bulundu: ${hbOrder.orderNumber}. Mutabakat Çekiliyor...`);
        const hbProvider = ActionProviderRegistry.getProvider('hepsiburada');
        const res2 = await hbProvider.executeAction({
            companyId: hbOrder.companyId,
            marketplace: 'hepsiburada',
            orderId: hbOrder.id,
            actionKey: 'SYNC_SETTLEMENT' as any,
            idempotencyKey: `SIMULATION_HB_${hbOrder.id}`
        });
        console.log("Hepsiburada Çevirmen (Adapter) Sonucu:", res2);
    } else {
         console.log(`\n[UYARI] Hepsiburada siparişi bulunamadı.`);
    }

    // 3. Show Product PNL if populated
    const pnls = await prisma.marketplaceProductPnl.findMany({
        take: 3,
        orderBy: { id: 'desc' },
        include: { product: true }
    });

    console.log(`\n[TEST] Ürün Bazlı Kârlılık ve Defter Dağılımı Sonucu:`);
    pnls.forEach(p => {
        console.log(`[${p.marketplace}] Ürün: ${p.product?.name} -> Ciro: ${p.grossRevenue} TL | Komisyon: ${p.commissionTotal} TL | Kargo: ${p.shippingTotal} TL | Kesinti: ${p.otherFeesTotal} TL | KÂR (PNL): ${p.netProfit} TL | Marj: %${p.profitMargin}`);
    });
}

run().catch(console.error).finally(() => prisma.$disconnect());
