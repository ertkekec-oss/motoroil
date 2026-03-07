import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { CompanyTrustBadge } from '@prisma/client';

export function calculateProfileCompleteness(profile: any): number {
    let score = 0;
    const weights: Record<string, number> = {
        displayName: 15,
        logoFileKey: 10,
        shortDescription: 10,
        longDescription: 15,
        sectors: 10,
        capabilities: 10,
        city: 5,
        country: 5,
        website: 10,
        email: 10
    };

    let totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    for (const [key, weight] of Object.entries(weights)) {
        const val = profile[key];
        if (val) {
            if (Array.isArray(val) && val.length > 0) {
                score += weight;
            } else if (typeof val === 'string' && val.trim().length > 0) {
                score += weight;
            } else if (typeof val === 'object' && Object.keys(val).length > 0) {
                score += weight;
            }
        }
    }

    // Ensure it's between 0-100
    const finalScore = Math.min(100, Math.round((score / totalWeight) * 100));
    return finalScore;
}

export async function recalculateNetworkTrustScore(profileId: string) {
    // 1. Fetch Profile
    const profile = await prisma.networkCompanyProfile.findUnique({
        where: { id: profileId },
        include: {
            sourceRelationships: true,
            targetRelationships: true,
            trustScore: true
        }
    });

    if (!profile) throw new Error("Profile not found");

    // 2. Profile Score (0-25)
    const completeness = calculateProfileCompleteness(profile);
    const profileScore = Math.round((completeness / 100) * 25);

    // Update completeness in DB
    if (profile.profileCompleteness !== completeness) {
        await prisma.networkCompanyProfile.update({
            where: { id: profileId },
            data: { profileCompleteness: completeness }
        });
        await publishEvent({
            type: 'NETWORK_PROFILE_COMPLETION_UPDATED',
            tenantId: profile.tenantId,
            meta: { profileId, completeness }
        });
    }

    // 3. Identity Score (0-25)
    let identityScore = 0;
    if (profile.verificationStatus === 'VERIFIED') identityScore += 15;
    if (profile.verificationStatus === 'PENDING') identityScore += 5;
    if (profile.email) identityScore += 5;
    if (profile.website) identityScore += 5;
    identityScore = Math.min(25, identityScore);

    // 4. Network Score (0-25)
    const activeRels = [...profile.sourceRelationships, ...profile.targetRelationships]
        .filter(r => r.status === 'ACTIVE');

    let networkScore = 0;
    if (activeRels.length > 0) networkScore += 10;
    if (activeRels.length > 5) networkScore += 5;
    if (activeRels.length > 20) networkScore += 10;
    networkScore = Math.min(25, networkScore);

    // 5. Activity Score (0-25)
    // Simplify: calculate based on recent relationship activity.
    let activityScore = 5; // Base
    const recentActivity = activeRels.some(r => {
        if (!r.lastActivityAt) return false;
        const diffDays = Math.floor((Date.now() - r.lastActivityAt.getTime()) / (1000 * 3600 * 24));
        return diffDays < 30;
    });
    if (recentActivity) activityScore += 15;
    if (profile.updatedAt.getTime() > Date.now() - (30 * 24 * 3600 * 1000)) activityScore += 5;
    activityScore = Math.min(25, activityScore);

    // 6. Total Score
    const totalScore = identityScore + profileScore + networkScore + activityScore;

    // 7. Badge determination
    let badge: CompanyTrustBadge = 'UNVERIFIED';
    if (totalScore >= 90 && profile.verificationStatus === 'VERIFIED') badge = 'VERIFIED_BUSINESS';
    else if (totalScore >= 70) badge = 'TRUSTED_PARTNER';
    else if (totalScore >= 40) badge = 'ACTIVE_TRADER';
    else if (totalScore >= 20) badge = 'NEW_MEMBER';
    else badge = 'UNVERIFIED';

    // 8. Upsert Trust Score
    const updatedTrustScore = await prisma.networkTrustScore.upsert({
        where: { profileId },
        create: {
            tenantId: profile.tenantId,
            profileId: profile.id,
            score: totalScore,
            badge: badge,
            identityScore,
            profileScore,
            networkScore,
            activityScore,
            lastCalculatedAt: new Date()
        },
        update: {
            score: totalScore,
            badge: badge,
            identityScore,
            profileScore,
            networkScore,
            activityScore,
            lastCalculatedAt: new Date()
        }
    });

    await publishEvent({
        type: 'NETWORK_TRUST_SCORE_UPDATED',
        tenantId: profile.tenantId,
        meta: { profileId, newScore: totalScore, newBadge: badge }
    });

    return updatedTrustScore;
}
