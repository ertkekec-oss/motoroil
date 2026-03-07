import prisma from '@/lib/prisma';
import { NetworkMarketSignalType, NetworkTrendDirection } from '@prisma/client';

export async function computeCategoryHeat(categoryId: string) {
    const oppsCount = await prisma.networkTradeOpportunity.count({
        where: { categoryId, status: 'ACTIVE' }
    });

    const recommendationDensity = await prisma.networkRecommendation.count({
        where: { status: 'ACTIVE' }
    }); // Needs more specific category filter in actual data model depending on recommendation types

    if (oppsCount > 5) {
        return {
            signalType: 'MARKET_HEAT' as NetworkMarketSignalType,
            intensityScore: Math.min((oppsCount * 12) + 20, 100),
            confidenceScore: 75,
            supportingSignalCount: oppsCount,
            trendDirection: 'UP' as NetworkTrendDirection,
            signalSummary: `Network çapında yüksek aktivite ve ticaret yoğunluğu var.`
        };
    }
    return null;
}

export async function computeRFQSurgeSignals(categoryId: string) {
    return null; // Implemented once routing wave data grows
}
