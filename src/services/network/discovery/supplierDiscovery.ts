import prisma from '@/lib/prisma';
import { CapabilityType, Prisma } from '@prisma/client';
import { buildProfileVisibilityProjection } from '../engine/visibility';
import { calculateNetworkProximity } from './proximity';

export interface DiscoverSuppliersInput {
    categoryId?: string;
    country?: string;
    city?: string;
    capabilityType?: CapabilityType;
    minTrustScore?: number;
    limit?: number;
}

export async function discoverSuppliers(viewerTenantId: string, input: DiscoverSuppliersInput) {
    const { categoryId, country, city, capabilityType, minTrustScore = 0, limit = 50 } = input;

    // Build Prisma query dynamically
    let baseWhere: Prisma.NetworkCompanyProfileWhereInput = {
        tenantId: { not: viewerTenantId },
        isDiscoveryEnabled: true,
        visibilityLevel: { not: 'PRIVATE' },
        trustScore: {
            score: { gte: minTrustScore }
        }
    };

    if (country) baseWhere.country = country;
    if (city) baseWhere.city = city;

    if (capabilityType || categoryId) {
        baseWhere.networkCapabilities = {
            some: {
                ...(capabilityType ? { capabilityType } : {}),
                ...(categoryId ? { categoryId } : {})
            }
        };
    }

    const profiles = await prisma.networkCompanyProfile.findMany({
        where: baseWhere,
        include: {
            trustScore: true,
            networkCapabilities: true,
            _count: { select: { sourceRelationships: true, targetRelationships: true } }
        },
        take: limit
    });

    const activeRels = await prisma.companyRelationship.findMany({
        where: {
            OR: [{ sourceTenantId: viewerTenantId }, { targetTenantId: viewerTenantId }],
            status: 'ACTIVE'
        }
    });

    const relMap = new Map();
    activeRels.forEach(r => {
        const otherId = r.sourceTenantId === viewerTenantId ? r.targetTenantId : r.sourceTenantId;
        relMap.set(otherId, r);
    });

    // Score and project profiles
    const projectedProfiles = await Promise.all(
        profiles.map(async profile => {
            const relationship = relMap.get(profile.tenantId) || null;
            const projected = buildProfileVisibilityProjection(
                viewerTenantId,
                profile as any,
                'NETWORK_DISCOVERY',
                relationship
            );

            if (!projected) return null;

            const proximityScore = await calculateNetworkProximity(viewerTenantId, profile.tenantId);

            // Calculate discoveryScore
            const trustScoreValue = profile.trustScore?.score || 0;
            const completionValue = profile.profileCompleteness || 0;
            // Weighted discovery score: 40% trust, 30% proximity, 30% completion
            const discoveryScore = (trustScoreValue * 0.4) + (proximityScore * 0.3) + (completionValue * 0.3);

            return {
                ...projected,
                discoveryScore,
                proximityScore
            };
        })
    );

    const validProfiles = projectedProfiles.filter(Boolean) as any[];

    // Sort by discovery score descending
    validProfiles.sort((a, b) => b.discoveryScore - a.discoveryScore);

    return validProfiles;
}
