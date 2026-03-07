export function projectScoreForTenant(score: any) {
    if (!score) return null;
    return {
        // Tenants only see UI-friendly tag names and % score, not raw formula components
        scorePercent: Math.round(score.score),
        tags: score.scoreBreakdown?.reasonCodes || [],
        tier: score.recommendationTier,
        explanation: score.scoreBreakdown?.userFriendlyExplanation || null
    };
}
