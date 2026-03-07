import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentReliabilityService {
    /**
     * Recalculates historical payment and refund footprint into a unified reliability snapshot.
     */
    static async recalculatePaymentReliabilitySnapshot(tenantId: string) {
        // In a real implementation this would aggregate from EscrowHolds/Orders
        // Using heuristics for phase architecture demo
        const simulatedSuccessful = 42;
        const simulatedRefunded = 2;
        const simulatedDisputed = 1;

        const score = 100 - ((simulatedRefunded * 2) + (simulatedDisputed * 5));
        const dedupeKey = `${tenantId}_PAY_REL_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}`;

        // Stale the old snapshot
        await prisma.networkPaymentReliabilitySnapshot.updateMany({
            where: { tenantId, status: 'ACTIVE' },
            data: { isStale: true, status: 'STALE', supersededAt: new Date() }
        });

        return await prisma.networkPaymentReliabilitySnapshot.create({
            data: {
                tenantId,
                successfulEscrowCount: simulatedSuccessful,
                refundedEscrowCount: simulatedRefunded,
                disputedEscrowCount: simulatedDisputed,
                avgReleaseDelayHours: 24, // avg 1 day
                paymentReliabilityScore: score,
                confidenceScore: 0.85,
                explanationJson: { summary: "Steady payments, low refunds." },
                calculationVersion: '1.0.0',
                dedupeKey,
                status: 'ACTIVE',
                lastCalculatedAt: new Date()
            }
        });
    }

    static async buildPaymentReliabilityBreakdown(tenantId: string) {
        const snap = await prisma.networkPaymentReliabilitySnapshot.findFirst({
            where: { tenantId, status: 'ACTIVE' }
        });

        return snap;
    }
}
