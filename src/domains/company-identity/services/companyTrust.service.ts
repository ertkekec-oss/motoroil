import prisma from "@/lib/prisma";
import { calculateCompanyTrustScore } from "../utils/trustScore";
import { aggregateTrustInputs } from "./companyTrustSignal.service";

export async function getOrCreateTrustProfile(tenantId: string) {
    let profile = await prisma.companyTrustProfile.findUnique({
        where: { tenantId },
    });

    if (!profile) {
        const identity = await prisma.companyIdentity.findUnique({ where: { tenantId } });
        profile = await prisma.companyTrustProfile.create({
            data: {
                tenantId,
                companyIdentityId: identity?.id,
            },
        });
    }
    return profile;
}

export async function recalculateCompanyTrustProfile(tenantId: string) {
    const profile = await getOrCreateTrustProfile(tenantId);
    const inputs = await aggregateTrustInputs(tenantId);

    const scoreResult = calculateCompanyTrustScore(inputs);

    const updatedProfile = await prisma.companyTrustProfile.update({
        where: { id: profile.id },
        data: {
            identityScore: scoreResult.identityScore,
            tradeScore: scoreResult.tradeScore,
            shippingScore: scoreResult.shippingScore,
            paymentScore: scoreResult.paymentScore,
            disputeScore: scoreResult.disputeScore,
            overallScore: scoreResult.overallScore,
            trustLevel: scoreResult.trustLevel,
            lastCalculatedAt: new Date(),
        },
    });

    await prisma.companyTrustScoreHistory.create({
        data: {
            tenantId,
            overallScore: scoreResult.overallScore,
            trustLevel: scoreResult.trustLevel,
            explanationJson: JSON.stringify(scoreResult.explanation),
            calculatedAt: new Date()
        },
    });

    return updatedProfile;
}

export async function getCompanyTrustProfile(tenantId: string) {
    return prisma.companyTrustProfile.findUnique({
        where: { tenantId },
        include: { companyIdentity: true }
    });
}

export async function listTrustProfiles(filters?: any) {
    return prisma.companyTrustProfile.findMany({
        where: filters || {},
        include: { companyIdentity: true },
        orderBy: { overallScore: "desc" },
    });
}

export async function getTrustedSuppliers(minLevel: string = "MEDIUM") {
    const levels = ["VERIFIED_HIGH", "HIGH", "MEDIUM", "LOW"];
    const minIdx = levels.indexOf(minLevel);
    const acceptableLevels = levels.filter((_, idx) => idx <= minIdx);

    return prisma.companyTrustProfile.findMany({
        where: {
            trustLevel: { in: acceptableLevels }
        },
        include: { companyIdentity: true }
    });
}

// Added support for Discovery & Liquidity Filtering natively
export async function getTrustedSuppliersForCanonicalProduct(canonicalProductId: string, minTrustLevel: string = "MEDIUM") {
    const suppliers = await prisma.tenantProductMapping.findMany({
        where: { canonicalProductId }
    });

    const trustedProfiles = await getTrustedSuppliers(minTrustLevel);
    const trustedTenantIds = new Set(trustedProfiles.map(t => t.tenantId));

    return suppliers.filter(s => trustedTenantIds.has(s.tenantId)).map(s => {
        const profile = trustedProfiles.find(p => p.tenantId === s.tenantId);
        return {
            mapping: s,
            trustProfile: profile
        };
    });
}
