import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { NetworkRecommendationTier } from '@prisma/client';

export interface AIMatchCandidate {
    profileId: string;
    totalScore: number;
    explanation: string;
    reasonTags: string[];
}

export async function generateTradeMatchCandidates(rfqId: string, buyerTenantId: string) {
    // Collect potential candidates
    const sessionScores = await prisma.networkSupplierScore.findMany({
        where: { rfqId },
        include: { supplierProfile: true }
    });

    return sessionScores.map(score => rankMatches(score));
}

export function rankMatches(supplierScore: any): AIMatchCandidate {
    // Analyze sub-scores, break downs, tags, and translate to AI explanation
    const reasons = (supplierScore.scoreBreakdown as any)?.reasonCodes || [];

    let explanation = "Supplier selected based on ";
    const explanationParts = [];
    const reasonTags = [];

    if (reasons.indexOf('HIGH_TRUST') !== -1) {
        explanationParts.push("proven trustworthiness");
        reasonTags.push("strong trust");
    }

    if (reasons.indexOf('VERIFIED_PROFILE') !== -1) {
        explanationParts.push("a highly complete profile");
        reasonTags.push("verified data");
    }

    if (reasons.indexOf('ACTIVE_TRADER') !== -1) {
        explanationParts.push("an active past trading history");
        reasonTags.push("active market presence");
    }

    if (reasons.indexOf('LOW_RESPONSE_HISTORY') !== -1) {
        explanationParts.push("but shows potential despite lower response rates");
        reasonTags.push("low response reliability");
    }

    if (explanationParts.length > 0) {
        explanation += explanationParts.join(", ");
    } else {
        explanation += "general category alignment.";
        reasonTags.push("category overlap");
    }

    return {
        profileId: supplierScore.supplierProfileId,
        totalScore: supplierScore.score,
        explanation: `${explanation}. Score: ${supplierScore.score}/100.`,
        reasonTags
    };
}
