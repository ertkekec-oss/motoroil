import { PrismaClient, NetworkOperationalSignalType } from '@prisma/client';

const prisma = new PrismaClient();

function createDedupeKey(parts: string[]) {
    return parts.join(':');
}

export class OperationalSignalService {
    /**
     * Generates operational signals based on recent shipping/escrow/dispute events.
     * Runs periodically.
     */
    static async generateOperationalSignals(scope: 'SYSTEM' | 'TENANT', tenantId?: string) {
        if (scope === 'SYSTEM') {
            await this.detectCarrierUnderperformance();
        } else if (tenantId) {
            await this.detectLateDeliveryRisk(tenantId);
            await this.detectHighDisputeRate(tenantId);
        }
    }

    static async detectLateDeliveryRisk(tenantId: string) {
        const version = "1.0.0";
        const dedupeKey = createDedupeKey(['late_delivery_risk', tenantId, new Date().toISOString().split('T')[0]]);

        // Attempt idempotent generation
        const existing = await prisma.networkOperationalSignal.findUnique({
            where: { dedupeKey }
        });

        if (existing) return existing;

        // Simulation logic for finding delayed shipments
        // e.g., shipment.normalizedStatus = 'IN_TRANSIT' && days > SLA

        // Dummy condition trigger
        const delayedCount = 3;

        if (delayedCount <= 0) return null;

        return await prisma.networkOperationalSignal.create({
            data: {
                tenantId,
                signalType: NetworkOperationalSignalType.LATE_DELIVERY_RISK,
                severity: 'MEDIUM',
                summary: `3 shipments are currently experiencing late delivery risks.`,
                explanationJson: {
                    delayedCount,
                    averageDelayHours: 14.5,
                    impactedCustomers: 3,
                },
                calculationVersion: version,
                dedupeKey,
                status: 'ACTIVE',
            }
        });
    }

    static async detectHighDisputeRate(tenantId: string) {
        const version = "1.0.0";
        const dedupeKey = createDedupeKey(['high_dispute_rate', tenantId, new Date().toISOString().split('T')[0]]);

        const existing = await prisma.networkOperationalSignal.findUnique({
            where: { dedupeKey }
        });

        if (existing) return existing;

        // Simulate dispute rate
        const disputeCount = 1;
        const rate = 0.05;

        if (rate < 0.03) return null;

        return await prisma.networkOperationalSignal.create({
            data: {
                tenantId,
                signalType: NetworkOperationalSignalType.HIGH_DISPUTE_RATE,
                severity: 'HIGH',
                summary: `Dispute rate has climbed to 5% in the last 30 days.`,
                explanationJson: {
                    disputeCount,
                    rate,
                    window: '30_DAYS',
                },
                calculationVersion: version,
                dedupeKey,
                status: 'ACTIVE',
            }
        });
    }

    static async detectCarrierUnderperformance() {
        const version = "1.0.0";
        const carrierCode = 'HEPSIJET'; // Demo logic
        const dedupeKey = createDedupeKey(['carrier_underperformance', carrierCode, new Date().toISOString().split('T')[0]]);

        const existing = await prisma.networkOperationalSignal.findUnique({
            where: { dedupeKey }
        });

        if (existing) return existing;

        // Based on carrierPerformance Snapshot
        return await prisma.networkOperationalSignal.create({
            data: {
                carrierCode,
                signalType: NetworkOperationalSignalType.CARRIER_UNDERPERFORMANCE,
                severity: 'LOW',
                summary: `Carrier HEPSIJET showing 4% increase in delay in MARMARA region.`,
                explanationJson: {
                    failureRateChange: 0.04,
                    affectedRegion: 'MARMARA',
                },
                calculationVersion: version,
                dedupeKey,
                status: 'ACTIVE',
            }
        });
    }
}
