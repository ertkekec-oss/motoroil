export class ProposalExplain {
    static generateExplanation(matchContext: any) {
        const drivers: string[] = [];
        const riskFlags: string[] = [];

        if (matchContext.demandUrgency > 80) drivers.push('HIGH_CATEGORY_DEMAND');
        if (matchContext.graphDistance <= 2) drivers.push('NEARBY_SUPPLIER_CLUSTER');
        if (matchContext.shippingReliability > 85) drivers.push('STRONG_SHIPPING_RELIABILITY');

        if (matchContext.financialSafety < 60) riskFlags.push('MODERATE_FINANCIAL_RISK');

        return {
            drivers,
            riskFlags,
            confidence: Math.round(matchContext.proposalScore || 0) || 82,
            summary: "Automated proposal generated based on robust networking."
        };
    }
}
