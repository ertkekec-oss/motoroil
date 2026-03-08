import { TRUST_WEIGHTS, TRUST_THRESHOLDS } from "../constants/trust.constants";

export function calculateCompanyTrustScore(input: {
    identityVerified: boolean;
    tradeCompletionRate: number; // 0.0 to 1.0
    shippingReliability: number; // 0.0 to 1.0
    paymentReliability: number;  // 0.0 to 1.0
    disputeRate: number;         // 0.0 to 1.0
}) {
    const identityScore = input.identityVerified ? 1.0 : 0.0;
    const tradeScore = Math.min(Math.max(input.tradeCompletionRate, 0), 1);
    const shippingScore = Math.min(Math.max(input.shippingReliability, 0), 1);
    const paymentScore = Math.min(Math.max(input.paymentReliability, 0), 1);

    // disputeRate is bad, so inverse it. e.g., 0 dispute rate = 1.0 score
    const disputeScore = Math.max(1.0 - input.disputeRate, 0);

    const overallScore =
        (identityScore * TRUST_WEIGHTS.IDENTITY_VERIFIED) +
        (tradeScore * TRUST_WEIGHTS.TRADE_COMPLETION) +
        (shippingScore * TRUST_WEIGHTS.SHIPPING_RELIABILITY) +
        (paymentScore * TRUST_WEIGHTS.PAYMENT_RELIABILITY) +
        (disputeScore * TRUST_WEIGHTS.DISPUTE_RATE);

    let trustLevel = "LOW";
    if (overallScore >= TRUST_THRESHOLDS.VERIFIED_HIGH && input.identityVerified) {
        trustLevel = "VERIFIED_HIGH";
    } else if (overallScore >= TRUST_THRESHOLDS.HIGH) {
        trustLevel = "HIGH";
    } else if (overallScore >= TRUST_THRESHOLDS.MEDIUM) {
        trustLevel = "MEDIUM";
    }

    const explanation = {
        identityScore: Number((identityScore * TRUST_WEIGHTS.IDENTITY_VERIFIED).toFixed(3)),
        tradeScore: Number((tradeScore * TRUST_WEIGHTS.TRADE_COMPLETION).toFixed(3)),
        shippingScore: Number((shippingScore * TRUST_WEIGHTS.SHIPPING_RELIABILITY).toFixed(3)),
        paymentScore: Number((paymentScore * TRUST_WEIGHTS.PAYMENT_RELIABILITY).toFixed(3)),
        disputeScore: Number((disputeScore * TRUST_WEIGHTS.DISPUTE_RATE).toFixed(3)),
        rawInputs: { ...input },
    };

    return {
        identityScore,
        tradeScore,
        shippingScore,
        paymentScore,
        disputeScore,
        overallScore,
        trustLevel,
        explanation,
    };
}
