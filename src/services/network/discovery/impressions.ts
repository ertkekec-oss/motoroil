import { PrismaClient } from '@prisma/client';
import { ExplainabilityRecord } from './types';

const prisma = new PrismaClient();

export async function logDiscoveryImpressions(
    viewerTenantId: string,
    items: { listingId: string; position: number; finalScore: number; breakdown: ExplainabilityRecord }[],
    requestId?: string
) {
    if (items.length === 0) return;

    try {
        await prisma.discoveryImpression.createMany({
            data: items.map(item => ({
                viewerTenantId,
                listingId: item.listingId,
                position: item.position,
                score: item.finalScore,
                reasonJson: item.breakdown as any,
                requestId,
                createdAt: new Date()
            })),
            skipDuplicates: true
        });
    } catch (error) {
        console.error('Failed to log discovery impressions', error); // Non-blocking logging
    }
}
