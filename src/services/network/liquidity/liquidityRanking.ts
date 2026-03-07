export class LiquidityRanking {
    static calculateMatchScore(
        graphDistance: number,
        trustScore: number,
        reputationScore: number,
        shippingScore: number,
        financeRisk: number,
        liquidityVolume: number
    ): number {
        // Inverse distance weight. 1 is best, graph distance > 5 has no bonus.
        const graphWeight = Math.max(0, (5 - Math.min(graphDistance, 5)) * 4); // Max 16
        const trustWeight = trustScore * 0.2; // Max 20
        const repWeight = reputationScore * 0.2; // Max 20
        const shipWeight = shippingScore * 0.15; // Max 15
        const financeWeight = Math.max(0, (100 - financeRisk) * 0.1); // Max 10
        const volumeWeight = Math.min(liquidityVolume, 100) * 0.19; // Max 19

        return Math.min(100, graphWeight + trustWeight + repWeight + shipWeight + financeWeight + volumeWeight);
    }
}
