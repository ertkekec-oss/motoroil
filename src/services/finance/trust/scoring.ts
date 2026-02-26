import { TrustSignals } from './signals';
import { SellerRiskTier } from '@prisma/client';

export interface ScoreComponents {
    baseScore: number;
    lateDeliveryPenalty: number;
    disputePenalty: number;
    slaBreachPenalty: number;
    chargebackPenalty: number;
    receivablePenalty: number;
    overridePenalty: number;
    stabilityBonus: number;
    volumeBonus: number;
    finalScore: number;
    tier: SellerRiskTier;
}

export function computeSellerScore(signals: TrustSignals): ScoreComponents {
    const baseScore = 100;

    // Penalties
    const lateDeliveryPenalty = Math.min(40, 40 * (1 - signals.onTimeRatio));
    const disputePenalty = Math.min(20, 20 * signals.disputeRate);
    const slaBreachPenalty = Math.min(15, signals.slaBreachCount * 5);
    const chargebackPenalty = Math.min(25, 25 * signals.chargebackRate);
    const receivablePenalty = Math.min(15, 15 * signals.receivableRate);
    const overridePenalty = Math.min(10, signals.overrideCount * 2);

    // Bonuses
    const stabilityBonus = Math.min(10, signals.stabilityScore);
    const volumeBonus = Math.min(10, signals.volumeIndex > 0 ? Math.log10(signals.volumeIndex) : 0);

    // Calculate final
    let finalScore = baseScore
        - lateDeliveryPenalty
        - disputePenalty
        - slaBreachPenalty
        - chargebackPenalty
        - receivablePenalty
        - overridePenalty
        + stabilityBonus
        + volumeBonus;

    // Clamp 0-100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // Tier Resolution
    let tier: SellerRiskTier;
    if (finalScore >= 85) tier = 'A';
    else if (finalScore >= 70) tier = 'B';
    else if (finalScore >= 50) tier = 'C';
    else tier = 'D';

    return {
        baseScore,
        lateDeliveryPenalty,
        disputePenalty,
        slaBreachPenalty,
        chargebackPenalty,
        receivablePenalty,
        overridePenalty,
        stabilityBonus,
        volumeBonus,
        finalScore,
        tier
    };
}
