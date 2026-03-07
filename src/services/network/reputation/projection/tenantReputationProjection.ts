export class TenantReputationProjection {
    static projectOverview(score: any, snapshot: any, breakdown: any) {
        if (!score) return null;

        return {
            overallScore: parseFloat(score.overallScore.toFixed(1)),
            reputationTier: score.reputationTier,
            trendDirection: snapshot?.trendDirection || 'STABLE',
            topPositives: breakdown?.drivingFactors?.topPositives?.slice(0, 3) || [],
            topNegatives: breakdown?.drivingFactors?.topNegatives?.slice(0, 3) || [],
            roleSummaries: {
                supplier: parseFloat((score.supplierScore || score.overallScore).toFixed(1)),
                buyer: parseFloat((score.buyerScore || score.overallScore).toFixed(1)),
                partner: parseFloat((score.partnerScore || score.overallScore).toFixed(1))
            },
            explanation: score.explanationJson?.summary || 'Standard reputation level based on aggregated activity.',
            lastUpdated: score.lastCalculatedAt.toISOString()
        };
    }

    static projectSignalsList(signals: any[]) {
        return signals.map(s => ({
            type: s.signalType,
            direction: s.signalDirection,
            summary: s.summary,
            date: s.createdAt.toISOString()
        }));
    }

    static projectHistory(snapshots: any[]) {
        return snapshots.map(s => ({
            score: s.overallScore,
            tier: s.reputationTier,
            trend: s.trendDirection,
            date: s.lastCalculatedAt.toISOString()
        }));
    }
}
