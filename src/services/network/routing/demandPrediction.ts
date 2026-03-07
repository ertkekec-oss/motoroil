import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';

export async function computeCategoryDemandTrend(categoryId: string) {
    // Collect historical data about this category
    const signals = await prisma.networkInventorySignal.findMany({
        where: { productCategoryId: categoryId },
        select: { signalType: true, velocityScore: true, createdAt: true }
    });

    // Score based on signal types and velocity changes over time (Mocked for now)
    const demandSignals = signals.filter(s => s.signalType === 'HIGH_DEMAND' || s.signalType === 'SEASONAL_DEMAND');
    const overstockSignals = signals.filter(s => s.signalType === 'OVERSTOCK' || s.signalType === 'SLOW_MOVING');

    const trendScore = demandSignals.length * 10 - overstockSignals.length * 5;

    return Math.max(0, trendScore);
}

export async function collectDemandSignals() {
    // Generate AI matching vectors for next phase based on these signals.
    const allCategories = await prisma.networkInventorySignal.findMany({
        select: { productCategoryId: true },
        distinct: ['productCategoryId']
    });

    const predictions = [];

    for (const cat of allCategories) {
        const score = await computeCategoryDemandTrend(cat.productCategoryId);
        predictions.push({
            categoryId: cat.productCategoryId,
            demandScore: score,
            timestamp: new Date()
        });
    }

    // In future phases, these predictions would be stored in a new materialized view.
    return predictions;
}
