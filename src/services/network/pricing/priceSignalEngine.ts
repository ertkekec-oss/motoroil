import prisma from '@/lib/prisma';

export class PriceSignalEngine {
    static generateDedupeKey(categoryId: string, regionCode: string | null) {
        return `PRC_${categoryId}_${regionCode || 'GLB'}_${new Date().toISOString().split('T')[0]}`;
    }

    static async generateCategoryPriceSignals() {
        console.log('[PriceSignalEngine] Generating network price signals...');

        // Mock discovering 2 main categories
        const categories = [
            { id: 'CAT_LUBRICANTS', region: 'TR-34', basePrice: 1000 },
            { id: 'CAT_SPARE_PARTS', region: 'TR-06', basePrice: 2400 }
        ];

        let count = 0;

        for (const cat of categories) {
            const dedupeKey = this.generateDedupeKey(cat.id, cat.region);

            // Random volatile shifts
            const volatility = Math.random() * 0.15; // up to 15%
            const supplyPres = Math.random() * 100;
            const demandPres = Math.random() * 100;

            const p25 = cat.basePrice * (1 - volatility);
            const p75 = cat.basePrice * (1 + volatility);

            await prisma.networkPriceSignal.upsert({
                where: { dedupeKey },
                update: {
                    medianPrice: cat.basePrice,
                    p25Price: p25,
                    p75Price: p75,
                    priceVolatility: volatility * 100,
                    supplyPressureScore: supplyPres,
                    demandPressureScore: demandPres,
                    updatedAt: new Date()
                },
                create: {
                    categoryId: cat.id,
                    regionCode: cat.region,
                    medianPrice: cat.basePrice,
                    p25Price: p25,
                    p75Price: p75,
                    priceVolatility: volatility * 100,
                    supplyPressureScore: supplyPres,
                    demandPressureScore: demandPres,
                    sampleSize: 120, // baseline mock
                    calculationVersion: '1.0.0',
                    dedupeKey,
                    expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
                }
            });
            count++;
        }

        return count;
    }
}
