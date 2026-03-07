import { PrismaClient, NetworkReputationSignalType, NetworkReputationSignalDirection } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationSignalsService {

    static async generateReputationSignals(tenantId: string) {
        // Invalidate old signals for tenant
        await prisma.networkReputationSignal.updateMany({
            where: { tenantId, status: 'ACTIVE' },
            data: { isStale: true, status: 'STALE' }
        });

        const signals: any[] = [];

        // 1. Trust Component
        const trustScore = await prisma.networkTrustScore.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' }
        });
        if (trustScore && trustScore.score > 85) {
            signals.push(this.buildSignal(tenantId, 'TRUST_STRONG', 'POSITIVE', 10, 5, 'Highly trusted member.'));
        }

        // 2. Shipping Component
        const shippingInfo = await prisma.networkShippingReliabilityScore.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' }
        });

        if (shippingInfo) {
            if (shippingInfo.score > 90) {
                signals.push(this.buildSignal(tenantId, 'SHIPPING_RELIABLE', 'POSITIVE', 8, 4, 'Excellent shipping performance.'));
            } else if (shippingInfo.score < 60) {
                signals.push(this.buildSignal(tenantId, 'SHIPPING_UNRELIABLE', 'NEGATIVE', 15, -12, 'History of delayed shipments.'));
            }
        }

        // 3. Operational Signals (Disputes, Escrow delays)
        const opSignals = await prisma.networkOperationalSignal.findMany({
            where: { tenantId, status: 'ACTIVE' },
            take: 10
        });

        opSignals.forEach(op => {
            if (op.signalType === 'HIGH_DISPUTE_RATE') {
                signals.push(this.buildSignal(tenantId, 'HIGH_DISPUTE_RATE', 'NEGATIVE', 20, -15, 'Frequent trade disputes.'));
            } else if (op.signalType === 'REFUND_RISK') {
                signals.push(this.buildSignal(tenantId, 'ESCROW_REFUND_HEAVY', 'NEGATIVE', 12, -8, 'Elevated refund ratio in past trades.'));
            }
        });

        // Insert new signals
        for (const sig of signals) {
            try {
                await prisma.networkReputationSignal.create({ data: sig });
            } catch (e) {
                // skip duplicates
            }
        }

        return signals;
    }

    static buildSignal(
        tenantId: string,
        type: NetworkReputationSignalType,
        direction: NetworkReputationSignalDirection,
        weight: number,
        scoreImpact: number,
        summary: string
    ) {
        const dedupeKey = `${tenantId}_${type}_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}`;

        return {
            tenantId,
            signalType: type,
            signalDirection: direction,
            weight,
            scoreImpact,
            confidence: 0.9,
            summary,
            explanationJson: { generatedAt: new Date().toISOString() },
            calculationVersion: '1.0.0',
            dedupeKey,
            status: 'ACTIVE'
        };
    }
}
