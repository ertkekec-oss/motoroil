import { NetworkShippingReliabilityScore, NetworkCarrierPerformanceSnapshot, NetworkOperationalSignal } from '@prisma/client';
import { ExplanationBuilder } from '../intelligence/explanations';

export class OperationalProjection {
    /**
     * Maps the raw shipping reliability score to a safe tenant-facing format.
     * Prevents sharing network averages or raw dedupe keys.
     */
    static projectShippingReliabilityForTenant(score: NetworkShippingReliabilityScore | null) {
        if (!score) return null;

        return {
            currentLevel: score.score, // e.g., 90 out of 100
            explanation: ExplanationBuilder.buildTenantScoreExplanation(score.score, score.completedDisputeCount, score.deliverySuccessScore),
            updatedAt: score.lastCalculatedAt.toISOString(),
            trend: score.score >= 90 ? 'POSITIVE' : score.score < 50 ? 'CRITICAL' : 'NEUTRAL'
        };
    }

    /**
     * Admin view with all metrics and debug info.
     */
    static projectShippingReliabilityForAdmin(score: NetworkShippingReliabilityScore | null) {
        if (!score) return null;

        return {
            id: score.id,
            tenantId: score.tenantId,
            profileId: score.profileId,
            score: score.score,
            subScores: {
                onTimeDeliveryScore: score.onTimeDeliveryScore,
                disputePenaltyScore: score.disputePenaltyScore,
                deliverySuccessScore: score.deliverySuccessScore,
                refundPenaltyScore: score.refundPenaltyScore,
            },
            volume: {
                completedShipmentCount: score.completedShipmentCount,
                completedDisputeCount: score.completedDisputeCount,
            },
            system: {
                calculationVersion: score.calculationVersion,
                dedupeKey: score.dedupeKey,
                status: score.status,
                isStale: score.isStale,
                expiresAt: score.expiresAt,
            },
            lastCalculatedAt: score.lastCalculatedAt.toISOString(),
        };
    }

    static projectCarrierPerformanceForAdmin(snapshot: NetworkCarrierPerformanceSnapshot | null) {
        if (!snapshot) return null;

        return {
            carrierCode: snapshot.carrierCode,
            scope: snapshot.regionCode ? `Region: ${snapshot.regionCode}` : 'GLOBAL',
            onTimeRate: snapshot.onTimeRate,
            deliverySuccessRate: snapshot.deliverySuccessRate,
            failureRate: snapshot.failureRate,
            avgDeliveryHours: snapshot.avgDeliveryHours,
            volume: snapshot.shipmentCount,
            riskRatio: snapshot.disputeLinkedShipmentCount,
            confidenceScore: snapshot.confidenceScore,
            lastCalculatedAt: snapshot.lastCalculatedAt.toISOString(),
        };
    }

    static projectOperationalSignalForTenant(signal: NetworkOperationalSignal | null) {
        if (!signal) return null;

        return {
            id: signal.id,
            signalType: signal.signalType,
            severity: signal.severity,
            summary: signal.summary,
            createdAt: signal.createdAt.toISOString()
        };
    }
}
