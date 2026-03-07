import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { NetworkRecommendationTier, RoutingWaveCandidate } from '@prisma/client';

export async function scoreSupplierForRFQ(rfqId: string, buyerTenantId: string, supplierProfileId: string) {
    // Determine the scores based on signals, proximity, trust, etc.
    const profile = await prisma.networkCompanyProfile.findUnique({
        where: { id: supplierProfileId },
        include: { trustScore: true }
    });

    if (!profile) throw new Error("Supplier profile not found");

    let totalScore = 0;
    const reasonCodes: string[] = [];

    // Trust Score
    const trust = profile.trustScore?.score || 0;
    if (trust > 80) reasonCodes.push("HIGH_TRUST");
    totalScore += trust * 0.4;

    // Profile Completion
    const completion = profile.profileCompleteness || 0;
    if (completion > 80) reasonCodes.push("VERIFIED_PROFILE");
    totalScore += completion * 0.2;

    // Network Activity
    if (profile.trustScore?.activityScore && profile.trustScore.activityScore > 15) {
        reasonCodes.push("ACTIVE_TRADER");
        totalScore += 20;
    } else {
        reasonCodes.push("LOW_RESPONSE_HISTORY");
        totalScore -= 10;
    }

    // Heuristics for Tier
    let tier: NetworkRecommendationTier = 'FALLBACK';
    let waveCandidate: RoutingWaveCandidate = 'NONE';

    if (totalScore >= 70) {
        tier = 'PRIMARY';
        waveCandidate = 'WAVE_1';
    } else if (totalScore >= 40) {
        tier = 'SECONDARY';
        waveCandidate = 'WAVE_2';
    } else {
        tier = 'FALLBACK';
        waveCandidate = 'NONE';
    }

    const maxScore = Math.min(100, Math.max(0, Math.round(totalScore)));

    const scoreEntry = await prisma.networkSupplierScore.create({
        data: {
            rfqId,
            buyerTenantId,
            supplierTenantId: profile.tenantId,
            supplierProfileId,
            score: maxScore,
            confidence: maxScore,
            scoreBreakdown: { reasonCodes },
            recommendationTier: tier,
            waveCandidate: waveCandidate
        }
    });

    await publishEvent({
        type: 'NETWORK_SUPPLIER_SCORE_COMPUTED',
        tenantId: buyerTenantId,
        meta: { scoreId: scoreEntry.id, supplierId: profile.id, score: maxScore }
    });

    return scoreEntry;
}

export async function scoreSuppliersForOpportunity(opportunityId: string, buyerTenantId: string, supplierProfileId: string) {
    // Similar to RFQ scoring, but context is opportunity
    return scoreSupplierForRFQ(`opp-${opportunityId}`, buyerTenantId, supplierProfileId);
}

export function buildSupplierScoreBreakdown(score: number, confidence: number, reasons: string[]) {
    return {
        score,
        confidence,
        reasons
    };
}
