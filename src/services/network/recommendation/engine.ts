import prisma from '@/lib/prisma';
import { RecommendationType } from '@prisma/client';
import { calculateNetworkProximity } from '../discovery/proximity';
import { publishEvent } from '@/lib/events/dispatcher';

export async function recommendCompaniesForTenant(viewerTenantId: string) {
    const viewerProfile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId: viewerTenantId },
        include: { trustScore: true }
    });

    if (!viewerProfile) return [];

    // Simple heuristic: Get top rated public/network profiles NOT already related
    const existingRels = await prisma.companyRelationship.findMany({
        where: {
            OR: [{ sourceTenantId: viewerTenantId }, { targetTenantId: viewerTenantId }],
        },
        select: { targetProfileId: true, sourceProfileId: true }
    });

    const existingProfileIds = new Set(
        existingRels.map(r => r.sourceProfileId === viewerProfile.id ? r.targetProfileId : r.sourceProfileId)
    );

    const candidates = await prisma.networkCompanyProfile.findMany({
        where: {
            tenantId: { not: viewerTenantId },
            isDiscoveryEnabled: true,
            visibilityLevel: { not: 'PRIVATE' },
            id: { notIn: Array.from(existingProfileIds) }
        },
        include: { trustScore: true, networkCapabilities: true },
        take: 50
    });

    const recommendations = await Promise.all(
        candidates.map(async candidate => {
            const proximityScore = await calculateNetworkProximity(viewerTenantId, candidate.tenantId);
            const trustScoreValue = candidate.trustScore?.score || 0;
            const completionValue = candidate.profileCompleteness || 0;

            // Assume 50% trust, 30% proximity, 20% completeness
            const score = (trustScoreValue * 0.5) + (proximityScore * 0.3) + (completionValue * 0.2);

            // Infer type based on capability
            let recType: RecommendationType = 'PARTNER';
            if (candidate.networkCapabilities.some(c => c.capabilityType === 'MANUFACTURER' || c.capabilityType === 'WHOLESALER')) {
                recType = 'SUPPLIER';
            } else if (candidate.networkCapabilities.some(c => c.capabilityType === 'DISTRIBUTOR')) {
                recType = 'BUYER';
            } else if (candidate.networkCapabilities.some(c => c.capabilityType === 'SERVICE_PROVIDER' || c.capabilityType === 'LOGISTICS' || c.capabilityType === 'FINANCE')) {
                recType = 'SERVICE';
            }

            return {
                targetProfile: candidate,
                score,
                recommendationType: recType,
                reason: `Toplu güvenilirlik skoruna ve ağ yakınlığına göre önerilir. (Score: ${Math.round(score)})`
            };
        })
    );

    // Filter minimum score and sort
    const topRecs = recommendations
        .filter(r => r.score >= 30) // Minimum acceptable score
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Return top 5

    // Save to DB
    for (const rec of topRecs) {
        await prisma.networkRecommendation.create({
            data: {
                viewerTenantId,
                targetProfileId: rec.targetProfile.id,
                recommendationType: rec.recommendationType,
                score: rec.score,
                reason: rec.reason
            }
        });
    }

    if (topRecs.length > 0) {
        await publishEvent({
            type: 'NETWORK_RECOMMENDATION_GENERATED',
            tenantId: viewerTenantId,
            meta: { count: topRecs.length }
        });
    }

    return topRecs;
}

export async function suggestSuppliersForRFQ(rfqId: string, categoryId?: string, location?: string) {
    // In a real app, parse RFQ tags and categories.
    // Here we query discovery engine with category and rank by trust + proximity.

    // Placeholder output
    return [];
}
