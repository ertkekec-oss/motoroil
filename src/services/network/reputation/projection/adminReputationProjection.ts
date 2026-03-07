export class AdminReputationProjection {
    static projectFullDetail(score: any, breakdown: any, signals: any[]) {
        if (!score) return null;

        return {
            scoreId: score.id,
            tenantId: score.tenantId,
            profileId: score.profileId,
            overallScore: score.overallScore,
            ...breakdown, // Unpack all detailed role scores and component trust weights
            signals: signals.map(s => ({
                id: s.id,
                type: s.signalType,
                direction: s.signalDirection,
                weight: s.weight,
                scoreImpact: s.scoreImpact,
                explanation: s.explanationJson,
                isStale: s.isStale,
                date: s.createdAt.toISOString()
            })),
            metadata: {
                calculationVersion: score.calculationVersion,
                dedupeKey: score.dedupeKey,
                isStale: score.isStale,
                expiresAt: score.expiresAt,
                supersededAt: score.supersededAt,
            }
        };
    }
}
