import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { buildProfileVisibilityProjection } from './visibility';

export async function listDiscoverableCompanies(currentTenantId: string, filters?: { search?: string, sector?: string, country?: string }) {
    // Current tenant does not see itself in discovery
    const baseWhere: Prisma.NetworkCompanyProfileWhereInput = {
        tenantId: { not: currentTenantId },
        isDiscoveryEnabled: true,
        visibilityLevel: { not: 'PRIVATE' }
    };

    if (filters?.search) {
        baseWhere.OR = [
            { displayName: { contains: filters.search, mode: 'insensitive' } },
            { shortDescription: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    if (filters?.country) {
        baseWhere.country = filters.country;
    }

    // Optional: filter on JSON arrays like sectors could be complex in Prisma, but for now we skip or do basic text match

    const profiles = await prisma.networkCompanyProfile.findMany({
        where: baseWhere,
        include: { trustScore: true, _count: { select: { sourceRelationships: true, targetRelationships: true } } },
        orderBy: [
            { trustScore: { score: 'desc' } },
            { verificationStatus: 'desc' },
            { profileCompleteness: 'desc' }
        ],
        take: 50 // Pagination later
    });

    // Determine relationships to pass to the projection engine
    // Get all existing relationships with these tenants for the current tenant
    const relationships = await prisma.companyRelationship.findMany({
        where: {
            OR: [
                { sourceTenantId: currentTenantId },
                { targetTenantId: currentTenantId }
            ],
            status: 'ACTIVE'
        }
    });

    // Map relationships for O(1) projection check
    const relMap = new Map();
    relationships.forEach(r => {
        const otherId = r.sourceTenantId === currentTenantId ? r.targetTenantId : r.sourceTenantId;
        relMap.set(otherId, r);
    });

    // Map each through projection
    const projectedProfiles = profiles.map(profile => {
        const relationship = relMap.get(profile.tenantId) || null;
        return buildProfileVisibilityProjection(
            currentTenantId,
            profile,
            'NETWORK_DISCOVERY',
            relationship
        );
    }).filter(Boolean); // Remove nulls

    return projectedProfiles;
}
