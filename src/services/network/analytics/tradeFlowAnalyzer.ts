import prisma from '@/lib/prisma';

export class TradeFlowAnalyzer {

    static async buildTradeAnalyticsSnapshots() {
        console.log('[TradeFlowAnalyzer] Compiling network trade flow metrics...');

        const targets = [
            { cat: 'CAT_LUBRICANTS', region: 'TR-34' },
            { cat: 'CAT_SPARE_PARTS', region: 'TR-06' }
        ];

        let createdCount = 0;

        for (const tg of targets) {

            // Mock rolling up values
            const vol = Math.random() * 500000 + 100000; // 100K-600K volume
            const dealSize = Math.random() * 15000 + 2000;
            const liqScore = Math.random() * 50 + 50;

            const snap = await prisma.networkTradeSnapshot.create({
                data: {
                    categoryId: tg.cat,
                    regionCode: tg.region,
                    tradeVolume: vol,
                    avgDealSize: dealSize,
                    liquidityScore: liqScore,
                    activeSupplierCount: Math.floor(Math.random() * 50 + 10),
                    activeBuyerCount: Math.floor(Math.random() * 150 + 20),
                    calculationVersion: '1.0.0',
                    expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
                }
            });

            createdCount++;
        }

        return createdCount;
    }

    static async getRecentSnapshots(limit: number = 20) {
        return prisma.networkTradeSnapshot.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
