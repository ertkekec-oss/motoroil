export class AdminRiskProjection {
    static projectFullDetail(score: any, signals: any[], policy: any) {
        if (!score) return null;

        return {
            id: score.id,
            buyerTenantId: score.buyerTenantId,
            sellerTenantId: score.sellerTenantId,
            contextType: score.contextType,
            overallRiskScore: score.overallRiskScore,
            tier: score.riskTier,
            components: {
                paymentReliability: score.paymentReliabilityScore,
                disputeProbability: score.disputeProbabilityScore,
                shippingRisk: score.shippingRiskScore,
                reputationRisk: score.reputationRiskScore,
                escrowRisk: score.escrowRiskScore
            },
            signals: (signals || []).map(s => ({
                type: s.signalType,
                direction: s.signalDirection,
                weight: s.weight,
                impact: s.scoreImpact,
                summary: s.summary
            })),
            activePolicy: policy ? {
                decision: policy.decisionType,
                releaseStrategy: policy.releaseStrategy,
                holdDays: policy.holdDays,
                disputeWindowHours: policy.disputeWindowHours,
                manualReviewRequired: policy.manualReviewRequired
            } : null,
            metadata: {
                calculationVersion: score.calculationVersion,
                dedupeKey: score.dedupeKey,
                isStale: score.isStale
            }
        };
    }
}
