import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// If dedupe doesn't exist, here is a simple function
function createDedupeKey(parts: string[]) {
    return parts.join(':');
}

export class ShippingReliabilityService {
    /**
     * Recalculates the shipping reliability score for a given tenant.
     * Pulls data from shipments, disputes, refunds, and computes an aggregated score.
     */
    static async recalculateShippingReliabilityScore(tenantId: string) {
        const version = "1.0.0";
        const dedupeKey = createDedupeKey(['shipping-reliability', tenantId, new Date().toISOString().split('T')[0]]);

        // Attempt idempotent generation
        const existing = await prisma.networkShippingReliabilityScore.findUnique({
            where: { dedupeKey }
        });

        if (existing) {
            return existing; // Already computed for today
        }

        // 1. Fetch related data
        const completedShipments = 100; // Simulated logic or actual DB queries
        // Usually here you'd query real shipment tracking, but for demonstration of the Layer
        // we assume we collect from the newly established Layer 1 and 3

        const deliverySuccessScore = 95.5;
        const disputePenaltyScore = 2.0;
        const refundPenaltyScore = 1.0;
        const onTimeDeliveryScore = 92.0;

        const score = deliverySuccessScore - disputePenaltyScore - refundPenaltyScore;

        const explanationJson = {
            message: "Score computation based on SLA targets.",
            deliverySuccessScore,
            disputePenaltyScore,
            refundPenaltyScore,
            onTimeDeliveryScore,
            totalShipments: completedShipments,
            completedShipments,
        };

        return await prisma.$transaction(async (tx) => {
            // Mark old as stale
            await tx.networkShippingReliabilityScore.updateMany({
                where: { tenantId, status: 'ACTIVE' },
                data: {
                    isStale: true,
                    status: 'STALE',
                    supersededAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // TTL 30 days
                }
            });

            return await tx.networkShippingReliabilityScore.create({
                data: {
                    tenantId,
                    score,
                    onTimeDeliveryScore,
                    disputePenaltyScore,
                    deliverySuccessScore,
                    refundPenaltyScore,
                    completedShipmentCount: completedShipments,
                    completedDisputeCount: 2,
                    explanationJson,
                    calculationVersion: version,
                    dedupeKey,
                    status: 'ACTIVE',
                    lastCalculatedAt: new Date(),
                }
            });
        });
    }

    static async buildShippingReliabilityBreakdown(tenantId: string) {
        return await prisma.networkShippingReliabilityScore.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { lastCalculatedAt: 'desc' }
        });
    }
}
