import { PrismaClient, NetworkTradeRiskTier, NetworkTradeRiskContextType } from '@prisma/client';
import { TradeRiskSignalsService } from './riskSignals';
import { DisputeProbabilityService } from './disputeProbability';
import { PaymentReliabilityService } from './paymentReliability';

const prisma = new PrismaClient();

export class TradeRiskEngine {
    /**
     * Evaluates aggregate network risk across payment patterns, counterparty reputation, and known disputes.
     */
    static async recalculateTenantRisk(tenantId: string) {
        return await this.recalculateTradeRiskScore({ buyerTenantId: tenantId, contextType: 'TENANT' });
    }

    static async recalculateCounterpartyPairRisk(buyerTenantId: string, sellerTenantId: string) {
        return await this.recalculateTradeRiskScore({ buyerTenantId, sellerTenantId, contextType: 'COUNTERPARTY_PAIR' });
    }

    static async recalculateTradeRiskScore(context: { buyerTenantId?: string, sellerTenantId?: string, contextType: NetworkTradeRiskContextType }) {
        const signals = await TradeRiskSignalsService.generateTradeRiskSignals(context);

        // We read latest sub-scores logically.
        let basePaymentRel = 100;
        if (context.buyerTenantId) {
            const snap = await PaymentReliabilityService.recalculatePaymentReliabilitySnapshot(context.buyerTenantId);
            basePaymentRel = snap?.paymentReliabilityScore ?? 100;
        }

        const disputeProb = await DisputeProbabilityService.estimateDisputeProbability(context);

        let repRiskScore = 0; // Starts 0, higher is worse risk
        if (context.sellerTenantId) {
            const sellerRep = await prisma.networkReputationScore.findFirst({
                where: { tenantId: context.sellerTenantId, status: 'ACTIVE' }
            });
            if (sellerRep && sellerRep.reputationTier === 'WATCHLIST') repRiskScore += 40;
            if (sellerRep && sellerRep.reputationTier === 'RESTRICTED') repRiskScore += 100;
        }

        // Start baseline risk at 20. High risk components push score higher
        const overallRiskScore = Math.min(100, 20 + ((100 - basePaymentRel) * 0.4) + (disputeProb * 0.4) + repRiskScore * 0.2);

        const tier: NetworkTradeRiskTier = this.resolveRiskTier(overallRiskScore);

        const dedupeKey = `RISK_${context.contextType}_${context.buyerTenantId || 'NA'}_${context.sellerTenantId || 'NA'}_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}`;

        // Update stale states
        const whereCondition = { buyerTenantId: context.buyerTenantId, sellerTenantId: context.sellerTenantId, contextType: context.contextType, status: 'ACTIVE' };
        await prisma.networkTradeRiskScore.updateMany({
            where: whereCondition,
            data: { isStale: true, status: 'STALE', supersededAt: new Date() }
        });

        const newRisk = await prisma.networkTradeRiskScore.create({
            data: {
                buyerTenantId: context.buyerTenantId,
                sellerTenantId: context.sellerTenantId,
                contextType: context.contextType,
                overallRiskScore,
                paymentReliabilityScore: basePaymentRel,
                disputeProbabilityScore: disputeProb,
                shippingRiskScore: 10, // Mock heuristic
                reputationRiskScore: repRiskScore,
                escrowRiskScore: overallRiskScore * 0.9,
                routingRiskScore: overallRiskScore * 0.8,
                confidenceScore: 0.9,
                riskTier: tier,
                explanationJson: {
                    summary: "Dynamic trade risk logic executed.",
                    factors: "Aggregated dispute probability, partner payment reliability, and underlying reputation status."
                },
                calculationVersion: '1.0.0',
                dedupeKey,
                status: 'ACTIVE',
                lastCalculatedAt: new Date()
            }
        });

        return newRisk;
    }

    static resolveRiskTier(score: number): NetworkTradeRiskTier {
        if (score > 90) return 'RESTRICTED';
        if (score > 75) return 'VERY_HIGH';
        if (score > 50) return 'HIGH';
        if (score > 30) return 'MEDIUM';
        if (score > 15) return 'LOW';
        return 'VERY_LOW';
    }

    static async getTradeRiskScore(context: any) {
        return await prisma.networkTradeRiskScore.findFirst({
            where: { ...context, status: 'ACTIVE' },
            orderBy: { lastCalculatedAt: 'desc' }
        });
    }
}
