import { CompanyTrustProfile } from "@prisma/client";

export function mapTrustScoreToPercentage(score: number): number {
    return Math.round(score * 100);
}

export function mapTrustLevelToSegment(trustLevel: string): string {
    switch (trustLevel) {
        case "VERIFIED_HIGH": return "A";
        case "HIGH": return "B";
        case "MEDIUM": return "C";
        case "LOW": return "D";
        default: return "D";
    }
}

export function buildTenantTrustPresentation(profile: CompanyTrustProfile) {
    return {
        score100: mapTrustScoreToPercentage(profile.overallScore),
        segmentLabel: mapTrustLevelToSegment(profile.trustLevel),
        metrics: {
            identityScore: mapTrustScoreToPercentage(profile.identityScore),
            tradeScore: mapTrustScoreToPercentage(profile.tradeScore),
            shippingScore: mapTrustScoreToPercentage(profile.shippingScore),
            paymentScore: mapTrustScoreToPercentage(profile.paymentScore),
            disputeScore: mapTrustScoreToPercentage(profile.disputeScore),
        }
    };
}
