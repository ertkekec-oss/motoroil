import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found");

    console.log("Starting Retroactive PnL Calculation...");

    const events = await prisma.domainEvent.findMany({
        where: { eventType: 'SALE_COMPLETED' }
    });

    for (const event of events) {
        const payload = event.payload;
        const map = await prisma.marketplaceProductMap.findFirst({
            where: { marketplace: payload.marketplace, marketplaceCode: payload.sku }
        });

        if (map) {
            const saleAmount = Number(payload.saleAmount || 0);
            const product = await prisma.product.findUnique({ where: { id: map.productId } });
            const cost = product ? Number(product.buyPrice) : 0;
            const netProfit = saleAmount - cost;
            const margin = saleAmount > 0 ? (netProfit / saleAmount) * 100 : 0;

            await prisma.marketplaceProductPnl.upsert({
                where: {
                    companyId_productId_marketplace: {
                        companyId: company.id,
                        productId: map.productId,
                        marketplace: payload.marketplace
                    }
                },
                create: {
                    companyId: company.id,
                    productId: map.productId,
                    marketplace: payload.marketplace,
                    grossRevenue: saleAmount,
                    saleCount: 1,
                    fifoCostTotal: cost,
                    netProfit: netProfit,
                    profitMargin: margin
                },
                update: {
                    grossRevenue: { increment: saleAmount },
                    saleCount: { increment: 1 },
                    fifoCostTotal: { increment: cost },
                    netProfit: { increment: netProfit },
                    profitMargin: margin // Simplified update
                }
            });
            console.log(`  PnL Updated for ${map.productId} (Net: ${netProfit})`);
        } else {
            console.log(`  No map found for SKU: ${payload.sku} (${payload.marketplace})`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
