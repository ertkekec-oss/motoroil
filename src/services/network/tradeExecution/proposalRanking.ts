export class ProposalRanking {
    static calculateProposalScore(
        liquidityMatchScore: number,
        trustScore: number,
        reputationScore: number,
        shippingReliability: number,
        financialSafety: number,
        demandUrgency: number
    ): number {
        const matchWeight = liquidityMatchScore * 0.3; // Max 30
        const trustWeight = trustScore * 0.15; // Max 15
        const repWeight = reputationScore * 0.15; // Max 15
        const shipWeight = shippingReliability * 0.1; // Max 10
        const financeWeight = financialSafety * 0.2; // Max 20
        const urgencyWeight = Math.min(demandUrgency, 100) * 0.1; // Max 10

        return Math.min(100, matchWeight + trustWeight + repWeight + shipWeight + financeWeight + urgencyWeight);
    }
}
