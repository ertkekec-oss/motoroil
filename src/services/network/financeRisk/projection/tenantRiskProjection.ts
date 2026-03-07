export class TenantRiskProjection {
    static projectOverview(score: any, paymentSnapshot: any, disputeProb: any, escrowPolicy: any) {
        if (!score) return null;

        return {
            overallRiskTier: score.riskTier,
            shortExplanation: score.explanationJson?.factors || "General evaluation.",
            paymentReliabilitySummary: {
                score: paymentSnapshot?.paymentReliabilityScore ?? 100,
                successfulRatio: paymentSnapshot ? (paymentSnapshot.successfulEscrowCount / (paymentSnapshot.successfulEscrowCount + paymentSnapshot.refundedEscrowCount + paymentSnapshot.disputedEscrowCount)) * 100 : 100
            },
            disputeRiskSummary: disputeProb?.riskClass || 'UNKNOWN',
            recommendedFinanceMode: score.riskTier === 'VERY_LOW' ? 'AUTO_CONFIRMED' : 'STANDARD_ESCROW',
            releaseStrategySummary: {
                defaultHoldDays: escrowPolicy?.holdDays || 14,
                manualReviewPotential: escrowPolicy?.manualReviewRequired || false
            },
            lastCalculatedAt: score.lastCalculatedAt.toISOString()
        };
    }
}
