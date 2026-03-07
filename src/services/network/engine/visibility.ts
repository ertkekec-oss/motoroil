import { NetworkCompanyProfile, CompanyRelationship, CompanyRelationshipStatus } from '@prisma/client';

export type VisibilityContext = 'PUBLIC_DISCOVERY' | 'NETWORK_DISCOVERY' | 'ACTIVE_RELATIONSHIP' | 'SELF' | 'ADMIN';

export function buildProfileVisibilityProjection(
    viewerTenantId: string | null,
    targetProfile: NetworkCompanyProfile,
    context: VisibilityContext,
    relationship?: CompanyRelationship | null
) {
    if (context === 'SELF' || context === 'ADMIN') {
        return targetProfile;
    }

    const isPublic = targetProfile.isPublicListingEnabled && targetProfile.visibilityLevel === 'PUBLIC';
    const isNetwork = targetProfile.isDiscoveryEnabled && targetProfile.visibilityLevel !== 'PRIVATE';

    if (context === 'PUBLIC_DISCOVERY' && !isPublic) {
        return null;
    }

    if (context === 'NETWORK_DISCOVERY' && (!isNetwork && !isPublic)) {
        return null;
    }

    // Base properties safe for discovery
    const projected: any = {
        id: targetProfile.id,
        tenantId: targetProfile.tenantId, // added tenantId for API UI actions
        slug: targetProfile.slug,
        displayName: targetProfile.displayName,
        shortDescription: targetProfile.shortDescription,
        logoFileKey: targetProfile.logoFileKey,
        country: targetProfile.country,
        city: targetProfile.city,
        sectors: targetProfile.sectors,
        verificationStatus: targetProfile.verificationStatus,
        visibilityLevel: targetProfile.visibilityLevel,
        profileCompleteness: (targetProfile as any).profileCompleteness,
        trustScore: (targetProfile as any).trustScore ? {
            score: (targetProfile as any).trustScore.score,
            badge: (targetProfile as any).trustScore.badge
        } : null,
        _count: (targetProfile as any)._count
    };

    // If active relationship explicitly exists, expand projection scope
    if (context === 'ACTIVE_RELATIONSHIP' || (relationship && relationship.status === 'ACTIVE')) {
        projected.legalName = targetProfile.legalName;
        projected.longDescription = targetProfile.longDescription;
        projected.website = targetProfile.website;
        projected.email = targetProfile.email;
        projected.phone = targetProfile.phone;
        projected.capabilities = targetProfile.capabilities;
    }

    return projected;
}
