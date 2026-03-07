import { PrismaClient } from '@prisma/client';
import { ShippingReliabilityService } from './shippingReliability';

const prisma = new PrismaClient();

export class RoutingFeedbackService {
    /**
     * Applies operational weight to a supplier score when evaluating AI routing.
     * Modifies the base matchmaking score based on shipping success probabilities.
     */
    static async buildRoutingOperationalAdjustment(supplierTenantId: string, rfqContext: any) {
        const reliability = await ShippingReliabilityService.buildShippingReliabilityBreakdown(supplierTenantId);

        if (!reliability) {
            // Missing history => slight penalty for unknown ops reliability
            return { adjustmentFactor: 0.95, explanation: 'Missing continuous robust logistics history (-5%)' };
        }

        let factor = 1.0;

        // Bonus for high on-time delivery
        if (reliability.onTimeDeliveryScore > 98) {
            factor += 0.05; // 5% boost in routing priority
        } else if (reliability.onTimeDeliveryScore < 90) {
            factor -= 0.15; // 15% drop, delay-prone
        }

        // Heavy penalty for disputes
        if (reliability.disputePenaltyScore > 2) {
            factor -= 0.20; // Another 20% drop, high risk
        }

        // In a multi-carrier route with `rfqContext.targetRegion`, here we would check `CarrierPerformanceSnapshot`
        // but simplified via an aggregate factor here.

        return {
            adjustmentFactor: Math.max(0.5, factor), // Never drop below 50% purely on operations (unless banned)
            explanation: `Operational history modifier applied based on track record. Base RFQ matched score adjusted to ${Math.max(0.5, factor)}`
        };
    }

    static applyOperationalWeightToSupplierScore(score: number, adjustmentContext: { adjustmentFactor: number }) {
        if (!adjustmentContext || !adjustmentContext.adjustmentFactor) return score;
        return score * adjustmentContext.adjustmentFactor;
    }
}
