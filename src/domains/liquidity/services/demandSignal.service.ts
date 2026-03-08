import prisma from "@/lib/prisma";
import { calculateDemandSignal } from "../utils/demandScore";
import { buildDemandForecastSnapshot } from "./demandForecast.service";
import { DEMAND_CONSTANTS, DEMAND_SIGNAL_STATUS } from "../constants/demand.constants";

export async function detectDemandSignalForProduct(tenantId: string, productId: string) {
    // Generate latest snapshot to evaluate current situation
    const snapshot = await buildDemandForecastSnapshot(tenantId, productId);

    // A naive baseline - average across network if no local baseline (assumed 1.0 for simplicity fallback)
    const baselineSalesVelocity = 1.0;

    const signalCalc = calculateDemandSignal({
        salesVelocity: snapshot.avgDailySales,
        stockLevel: snapshot.stockLevel,
        daysToStockout: shadowDaysToStockout(snapshot.stockLevel, snapshot.avgDailySales),
        baselineSalesVelocity,
    });

    if (signalCalc.signalType && signalCalc.confidenceScore > 0.5) { // Meaningful signal threshold
        return createOrUpdateDemandSignal({
            tenantId,
            productId,
            canonicalProductId: snapshot.canonicalProductId || null,
            signalType: signalCalc.signalType,
            signalStrength: signalCalc.signalStrength,
            confidenceScore: signalCalc.confidenceScore,
            salesVelocity: snapshot.avgDailySales,
            stockLevel: snapshot.stockLevel,
            projectedDaysToStockout: snapshot.daysToStockout,
            reorderRecommendation: signalCalc.reorderRecommendation,
            explanationJson: JSON.stringify(signalCalc.explanation),
        });
    }

    return null;
}

export async function detectDemandSignalForCanonicalProduct(tenantId: string, canonicalProductId: string) {
    const mapping = await prisma.tenantProductMapping.findFirst({
        where: { tenantId, canonicalProductId }
    });
    if (!mapping) return null;
    return detectDemandSignalForProduct(tenantId, mapping.productId);
}

export async function createOrUpdateDemandSignal(params: {
    tenantId: string;
    productId: string | null;
    canonicalProductId: string | null;
    signalType: string;
    signalStrength: number;
    confidenceScore: number;
    salesVelocity?: number;
    stockLevel?: number;
    projectedDaysToStockout?: number | null;
    reorderRecommendation?: number;
    explanationJson?: string;
}) {
    let existingSignal = await prisma.demandSignal.findFirst({
        where: {
            tenantId: params.tenantId,
            productId: params.productId,
            status: DEMAND_SIGNAL_STATUS.OPEN,
        }
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEMAND_CONSTANTS.DEFAULT_SIGNAL_EXPIRY_DAYS);

    if (existingSignal) {
        // Upgrade signal type if new one is more critical like STOCKOUT_RISK over FAST_MOVING
        existingSignal = await prisma.demandSignal.update({
            where: { id: existingSignal.id },
            data: {
                signalType: params.signalType,
                signalStrength: params.signalStrength,
                confidenceScore: params.confidenceScore,
                salesVelocity: params.salesVelocity,
                stockLevel: params.stockLevel,
                projectedDaysToStockout: params.projectedDaysToStockout,
                reorderRecommendation: params.reorderRecommendation,
                updatedAt: new Date(),
                expiresAt,
            }
        });
    } else {
        existingSignal = await prisma.demandSignal.create({
            data: {
                tenantId: params.tenantId,
                productId: params.productId,
                canonicalProductId: params.canonicalProductId,
                signalType: params.signalType,
                signalStrength: params.signalStrength,
                confidenceScore: params.confidenceScore,
                salesVelocity: params.salesVelocity,
                stockLevel: params.stockLevel,
                projectedDaysToStockout: params.projectedDaysToStockout,
                reorderRecommendation: params.reorderRecommendation,
                status: DEMAND_SIGNAL_STATUS.OPEN,
                expiresAt,
            }
        });
    }

    // Always create history
    await prisma.demandSignalHistory.create({
        data: {
            tenantId: params.tenantId,
            productId: params.productId,
            canonicalProductId: params.canonicalProductId,
            signalType: params.signalType,
            signalStrength: params.signalStrength,
            confidenceScore: params.confidenceScore,
            explanationJson: params.explanationJson,
        }
    });

    return existingSignal;
}

export async function resolveDemandSignal(signalId: string) {
    return prisma.demandSignal.update({
        where: { id: signalId },
        data: { status: DEMAND_SIGNAL_STATUS.RESOLVED }
    });
}

export async function expireOldDemandSignals() {
    const expiredCount = await prisma.demandSignal.updateMany({
        where: {
            status: DEMAND_SIGNAL_STATUS.OPEN,
            expiresAt: { lt: new Date() }
        },
        data: { status: DEMAND_SIGNAL_STATUS.EXPIRED }
    });
    return expiredCount.count;
}

export async function listDemandSignals(tenantId: string, filters?: any) {
    return prisma.demandSignal.findMany({
        where: { tenantId, ...(filters || {}) },
        orderBy: { detectedAt: 'desc' },
    });
}

// Canonical Service Accessors for Liquidity matcher
export async function getOpenDemandSignalsForCanonicalProduct(canonicalProductId: string) {
    return prisma.demandSignal.findMany({
        where: {
            canonicalProductId,
            status: DEMAND_SIGNAL_STATUS.OPEN
        },
        orderBy: { signalStrength: 'desc' }
    });
}

// Global Network-level Discovery & Liquidity Filter
export async function getDemandCandidatesForLiquidity(minStrength: number = 0.5) {
    return prisma.demandSignal.findMany({
        where: {
            status: DEMAND_SIGNAL_STATUS.OPEN,
            signalStrength: { gte: minStrength }
        },
        orderBy: { signalStrength: 'desc' }
    });
}

// Helper calculation
function shadowDaysToStockout(stock: number, velocity: number) {
    if (velocity <= 0) return 999;
    return Math.floor(stock / velocity);
}
