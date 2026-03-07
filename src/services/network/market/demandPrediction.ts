import { upsertDerivedSignalSafely } from '../hardening/signals/signalLifecycle';
import prisma from '@/lib/prisma';
import { NetworkMarketSignalType, NetworkMarketSignalScopeType, NetworkTrendDirection } from '@prisma/client';
import { explainMarketSignal } from './explanations';
import { getMarketGraphContext } from './marketGraphContext';

export async function computeDemandSpikeSignals(scope: { categoryId: string, regionCode?: string }) {
    // Collect active NetworkInventorySignals in HIGH_DEMAND and NetworkTradeOpportunity on BUY side
    const buySignals = await prisma.networkInventorySignal.count({
        where: { productCategoryId: scope.categoryId, signalType: 'HIGH_DEMAND', status: 'ACTIVE' }
    });

    const buyOpps = await prisma.networkTradeOpportunity.count({
        where: { categoryId: scope.categoryId, signalType: 'AUTO_RMB', status: 'ACTIVE' }
    });

    const context = await getMarketGraphContext(scope);
    const supportingCount = buySignals + buyOpps;

    if (supportingCount < 3) return null; // INSUFFICIENT_SIGNAL_DATA skipped

    const score = Math.min((supportingCount * 12) + (context.overallDensity * 10), 100);

    return {
        signalType: 'DEMAND_SPIKE' as NetworkMarketSignalType,
        intensityScore: score,
        confidenceScore: supportingCount > 10 ? 90 : 65,
        supportingSignalCount: supportingCount,
        trendDirection: 'UP' as NetworkTrendDirection,
        signalSummary: `Talep artışı ve BUY fırsatı yoğunluğu var.`
    };
}
