import { DEMAND_CONSTANTS, DEMAND_SIGNAL_TYPES } from "../constants/demand.constants";

export function calculateDemandSignal(input: {
    salesVelocity: number;
    stockLevel: number;
    daysToStockout: number | null;
    baselineSalesVelocity: number;
}) {
    let signalType: string | null = null;
    let signalStrength = 0;
    let confidenceScore = 0;
    let reorderRecommendation = 0;
    let explanation: Record<string, unknown> = { ...input };

    // Check DEMAND_SPIKE
    if (input.baselineSalesVelocity > 0) {
        const spikeRatio = input.salesVelocity / input.baselineSalesVelocity;
        if (spikeRatio >= DEMAND_CONSTANTS.DEMAND_SPIKE_THRESHOLD) {
            signalType = DEMAND_SIGNAL_TYPES.DEMAND_SPIKE;
            signalStrength = Math.min(spikeRatio - 1.0, 1.0); // e.g. 1.5x -> 0.5 strength
            confidenceScore = 0.8;
            explanation.spikeRatio = spikeRatio;
        }
    }

    // Check FAST_MOVING_PRODUCT (overrides spike if both apply but moving super fast)
    if (input.salesVelocity >= DEMAND_CONSTANTS.FAST_MOVING_THRESHOLD) {
        if (!signalType || signalType === DEMAND_SIGNAL_TYPES.DEMAND_SPIKE) {
            signalType = DEMAND_SIGNAL_TYPES.FAST_MOVING_PRODUCT;
            signalStrength = Math.min(input.salesVelocity / (DEMAND_CONSTANTS.FAST_MOVING_THRESHOLD * 2), 1.0);
            confidenceScore = 0.85;
        }
    }

    // Check STOCKOUT_RISK (overrides others as it's the most critical)
    if (input.daysToStockout !== null && input.daysToStockout <= DEMAND_CONSTANTS.STOCKOUT_DAYS_THRESHOLD) {
        if (input.salesVelocity > 0) {
            signalType = DEMAND_SIGNAL_TYPES.STOCKOUT_RISK;
            // Strength inversely proportional to days left
            signalStrength = Math.min((DEMAND_CONSTANTS.STOCKOUT_DAYS_THRESHOLD - input.daysToStockout) / DEMAND_CONSTANTS.STOCKOUT_DAYS_THRESHOLD, 1.0);
            confidenceScore = 0.9;
        }
    }

    // Calculate recommended reorder qty if there is a signal
    if (signalType) {
        // Basic rule: order enough to cover 30 days of sales velocity
        reorderRecommendation = Math.max(Math.ceil((input.salesVelocity || input.baselineSalesVelocity) * 30 - input.stockLevel), 0);
    }

    return {
        signalType,
        signalStrength: Number(signalStrength.toFixed(3)),
        confidenceScore: Number(confidenceScore.toFixed(3)),
        reorderRecommendation,
        explanation,
    };
}
