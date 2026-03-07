export class LiquidityExplain {
    static generateExplanation(matchContext: any) {
        const drivers: string[] = [];
        const riskFlags: string[] = [];

        if (matchContext.trustScore > 80) drivers.push('HIGH_TRUST_NETWORK');
        if (matchContext.graphDistance <= 2) drivers.push('NEARBY_SUPPLIER_CLUSTER');
        if (matchContext.shippingScore > 85) drivers.push('STRONG_SHIPPING_PERFORMANCE');
        if (matchContext.reputationScore > 85) drivers.push('PREMIUM_REPUTATION');

        if (matchContext.financeRisk > 50) riskFlags.push('ELEVATED_FINANCIAL_RISK');
        if (matchContext.shippingScore < 50) riskFlags.push('POOR_SHIPPING_HISTORY');

        return {
            drivers,
            riskFlags,
            confidence: Math.round(matchContext.matchScore),
            summary: `${drivers.length} positive drivers detected.`
        };
    }
}
