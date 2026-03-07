import { TradeRiskEngine } from './tradeRiskEngine';

export class FinanceRiskFeedbackService {
    /**
     * Applies a negative match-score penalty in autonomous routing if risk is too high
     */
    static async buildRoutingRiskAdjustment(buyerTenantId: string, sellerTenantId: string) {
        const risk = await TradeRiskEngine.recalculateCounterpartyPairRisk(buyerTenantId, sellerTenantId);

        if (risk.riskTier === 'RESTRICTED') return -100; // Hard drop
        if (risk.riskTier === 'VERY_HIGH') return -50;
        if (risk.riskTier === 'HIGH') return -20;
        if (risk.riskTier === 'VERY_LOW') return +10; // Secure route confidence boost

        return 0;
    }

    static async buildDiscoveryRiskPenalty(sellerTenantId: string) {
        const risk = await TradeRiskEngine.recalculateTenantRisk(sellerTenantId);

        // If global tenant risk is high, discovery rank drops
        if (risk.riskTier === 'RESTRICTED' || risk.riskTier === 'VERY_HIGH') return 0.2;
        if (risk.riskTier === 'HIGH') return 0.6;

        return 1.0;
    }
}
