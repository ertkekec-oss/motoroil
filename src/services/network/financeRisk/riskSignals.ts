import { PrismaClient, NetworkTradeRiskSignalType, NetworkTradeRiskSignalDirection } from '@prisma/client';
import { DisputeProbabilityService } from './disputeProbability';
import { PaymentReliabilityService } from './paymentReliability';

const prisma = new PrismaClient();

export class TradeRiskSignalsService {

    static async generateTradeRiskSignals(context: { buyerTenantId?: string, sellerTenantId?: string }) {
        // Invalidate old signals for tenant pair (heuristic logic based on both sides or isolated context)
        const whereCondition = { buyerTenantId: context.buyerTenantId, sellerTenantId: context.sellerTenantId, status: 'ACTIVE' };
        await prisma.networkTradeRiskSignal.updateMany({
            where: whereCondition,
            data: { isStale: true, status: 'STALE' }
        });

        const signals: any[] = [];
        const disputeProb = await DisputeProbabilityService.estimateDisputeProbability(context);

        // Dispute signals
        if (disputeProb > 50) {
            signals.push(this.buildSignal(context, 'HIGH_DISPUTE_PROBABILITY', 'RISK_UP', 15, 20, 'History between pair and components indicate likely dispute.'));
        }

        // Payment footprint signals
        if (context.buyerTenantId) {
            let paymentData = await prisma.networkPaymentReliabilitySnapshot.findFirst({
                where: { tenantId: context.buyerTenantId, status: 'ACTIVE' }
            });
            if (!paymentData) paymentData = await PaymentReliabilityService.recalculatePaymentReliabilitySnapshot(context.buyerTenantId);

            if (paymentData.paymentReliabilityScore < 60) {
                signals.push(this.buildSignal(context, 'LOW_PAYMENT_RELIABILITY', 'RISK_UP', 20, 25, 'Buyer has poor escrow resolution consistency.'));
            } else if (paymentData.paymentReliabilityScore > 90) {
                signals.push(this.buildSignal(context, 'TRUSTED_COUNTERPARTY_PAIR', 'RISK_DOWN', 10, -10, 'Buyer shows strong payment history.'));
            }
        }

        // Reputation footprint
        if (context.sellerTenantId) {
            const sellerRep = await prisma.networkReputationScore.findFirst({
                where: { tenantId: context.sellerTenantId, status: 'ACTIVE' }
            });
            if (sellerRep && sellerRep.reputationTier === 'RESTRICTED') {
                signals.push(this.buildSignal(context, 'MANUAL_REVIEW_REQUIRED', 'RISK_UP', 100, 100, 'Counterparty is administratively restricted.'));
            } else if (sellerRep && sellerRep.reputationTier === 'WATCHLIST') {
                signals.push(this.buildSignal(context, 'WATCHLIST_COUNTERPARTY', 'RISK_UP', 50, 40, 'Counterparty is on an active Watchlist monitor.'));
            }
        }

        for (const sig of signals) {
            try {
                await prisma.networkTradeRiskSignal.create({ data: sig });
            } catch (e) { /* skip duplicate keys */ }
        }
        return signals;
    }

    static buildSignal(
        context: any,
        type: NetworkTradeRiskSignalType,
        direction: NetworkTradeRiskSignalDirection,
        weight: number,
        scoreImpact: number,
        summary: string
    ) {
        const bT = context.buyerTenantId || 'SYS';
        const sT = context.sellerTenantId || 'SYS';
        const dedupeKey = `RISK_${bT}_${sT}_${type}_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}`;

        return {
            buyerTenantId: context.buyerTenantId,
            sellerTenantId: context.sellerTenantId,
            signalType: type,
            signalDirection: direction,
            weight,
            scoreImpact,
            confidence: 0.85,
            summary,
            explanationJson: { generatedAt: new Date().toISOString() },
            calculationVersion: '1.0.0',
            dedupeKey,
            status: 'ACTIVE'
        };
    }
}
