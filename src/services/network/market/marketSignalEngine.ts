import prisma from '@/lib/prisma';
import { withIdempotentProcessing } from '../hardening/processing/retryPolicy';
import { getCurrentCalculationVersion } from '../hardening/rebuild/versioning';
import { upsertDerivedSignalSafely } from '../hardening/signals/signalLifecycle';

import { computeDemandSpikeSignals } from './demandPrediction';
import { computeSupplyPressureSignals, computeSupplySurplusSignals } from './supplyPressure';
import { computeCategoryHeat } from './categoryHeat';
import { explainMarketSignal } from './explanations';
import { NetworkMarketSignalScopeType } from '@prisma/client';

export async function generateMarketSignals(scope: { categoryId: string, regionCode?: string }) {
    const config = {
        processorType: 'MARKET_SIGNAL_GENERATE',
        entityType: 'CategoryRegion',
        entityId: `${scope.categoryId}_${scope.regionCode || 'GLOBAL'}`,
        input: scope
    };

    return withIdempotentProcessing(config, async () => {
        const version = await getCurrentCalculationVersion('NetworkMarketSignal');
        const results = [];

        // Run partial compute models
        const demandSpike = await computeDemandSpikeSignals(scope);
        if (demandSpike) {
            const explanationJson = explainMarketSignal(demandSpike.signalType, { scope, details: demandSpike.signalSummary });
            const saved = await upsertDerivedSignalSafely(
                prisma.networkMarketSignal,
                { signalScopeType: 'CATEGORY' as NetworkMarketSignalScopeType, categoryId: scope.categoryId, regionCode: scope.regionCode },
                { ...demandSpike, explanationJson },
                version,
                new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) // Expires in 3 days
            );
            results.push(saved);
        }

        const supplyPressure = await computeSupplyPressureSignals(scope);
        if (supplyPressure) {
            const explanationJson = explainMarketSignal(supplyPressure.signalType, { scope, details: supplyPressure.signalSummary });
            const saved = await upsertDerivedSignalSafely(
                prisma.networkMarketSignal,
                { signalScopeType: 'CATEGORY' as NetworkMarketSignalScopeType, categoryId: scope.categoryId, regionCode: scope.regionCode },
                { ...supplyPressure, explanationJson },
                version,
                new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
            );
            results.push(saved);
        }

        const marketHeat = await computeCategoryHeat(scope.categoryId);
        if (marketHeat) {
            const explanationJson = explainMarketSignal(marketHeat.signalType, { scope, details: marketHeat.signalSummary });
            const saved = await upsertDerivedSignalSafely(
                prisma.networkMarketSignal,
                { signalScopeType: 'CATEGORY' as NetworkMarketSignalScopeType, categoryId: scope.categoryId, regionCode: scope.regionCode },
                { ...marketHeat, explanationJson },
                version,
                new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
            );
            results.push(saved);
        }

        return results;
    });
}
