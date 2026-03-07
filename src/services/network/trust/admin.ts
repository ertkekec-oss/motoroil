import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { recalculateNetworkTrustScore } from './score';
import { NetworkVerificationStatus } from '@prisma/client';

export async function verifyCompany(profileId: string) {
    const profile = await prisma.networkCompanyProfile.update({
        where: { id: profileId },
        data: { verificationStatus: 'VERIFIED' }
    });

    await publishEvent({
        type: 'NETWORK_COMPANY_VERIFIED',
        tenantId: profile.tenantId,
        meta: { profileId }
    });

    await recalculateNetworkTrustScore(profileId);
    return profile;
}

export async function restrictCompany(profileId: string) {
    const profile = await prisma.networkCompanyProfile.update({
        where: { id: profileId },
        data: {
            verificationStatus: 'RESTRICTED',
            isDiscoveryEnabled: false
        }
    });

    await publishEvent({
        type: 'NETWORK_COMPANY_RESTRICTED',
        tenantId: profile.tenantId,
        meta: { profileId }
    });

    await recalculateNetworkTrustScore(profileId);
    return profile;
}

export async function suspendRelationship(relationshipId: string) {
    const rel = await prisma.companyRelationship.update({
        where: { id: relationshipId },
        data: { status: 'SUSPENDED' }
    });

    // Optionally recalculate for both profiles
    await recalculateNetworkTrustScore(rel.sourceProfileId);
    await recalculateNetworkTrustScore(rel.targetProfileId);

    return rel;
}
