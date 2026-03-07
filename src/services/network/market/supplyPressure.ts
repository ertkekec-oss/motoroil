import prisma from '@/lib/prisma';
import { NetworkMarketSignalType, NetworkTrendDirection } from '@prisma/client';

export async function computeSupplyPressureSignals(scope: { categoryId: string }) {
    const poorSupplySignals = await prisma.networkInventorySignal.count({
        where: { productCategoryId: scope.categoryId, signalType: 'STOCKOUT_RISK', status: 'ACTIVE' }
    });

    if (poorSupplySignals < 3) return null; // INSUFFICIENT DATA

    return {
        signalType: 'SUPPLY_SHORTAGE' as NetworkMarketSignalType,
        intensityScore: poorSupplySignals * 15,
        confidenceScore: 80,
        supportingSignalCount: poorSupplySignals,
        trendDirection: 'DOWN' as NetworkTrendDirection,
        signalSummary: `Tedarik daralması ve arz eksikliği sinyali alındı.`
    };
}

export async function computeSupplySurplusSignals(scope: { categoryId: string }) {
    const overstockSignals = await prisma.networkInventorySignal.count({
        where: { productCategoryId: scope.categoryId, signalType: 'OVERSTOCK', status: 'ACTIVE' }
    });

    if (overstockSignals >= 5) {
        return {
            signalType: 'SUPPLY_SURPLUS' as NetworkMarketSignalType,
            intensityScore: Math.min(overstockSignals * 10, 100),
            confidenceScore: 85,
            supportingSignalCount: overstockSignals,
            trendDirection: 'FLAT' as NetworkTrendDirection,
            signalSummary: `Aşırı stoklama ve yüksek arz tespiti.`
        };
    }
    return null;
}
