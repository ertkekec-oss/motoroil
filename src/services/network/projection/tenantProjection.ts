export function projectProfileForTenant(profile: any) {
    if (!profile) return null;
    return {
        id: profile.id,
        slug: profile.slug,
        displayName: profile.displayName,
        shortDescription: profile.shortDescription,
        country: profile.country,
        city: profile.city,
        sectors: profile.sectors,
        verificationStatus: profile.verificationStatus,
        trustBadge: profile.trustScore?.badge || 'UNVERIFIED',
    };
}
