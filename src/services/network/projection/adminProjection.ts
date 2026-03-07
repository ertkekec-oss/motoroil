export function projectProfileForAdmin(profile: any) {
    if (!profile) return null;
    return {
        ...profile, // Admins see everything
        trustScoreDetail: profile.trustScore || null,
        capabilitiesRaw: profile.networkCapabilities || []
    };
}
