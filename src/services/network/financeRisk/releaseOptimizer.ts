import { PrismaClient } from '@prisma/client';
import { EscrowPolicyEngine } from './escrowPolicyEngine';

const prisma = new PrismaClient();

export class ReleaseOptimizerService {
    /**
     * Refines historical release delays based on current shipment context and policy parameters.
     */
    static async optimizeReleaseStrategy(escrowHoldId: string, context: any) {
        // In production, this uses ML over time to detect delivery completion events earlier
        // and safe-trims holdDays if tracking indicates flawless transit.

        const policyDecision = await EscrowPolicyEngine.buildEscrowPolicyDecision(escrowHoldId, context);

        if (context.flawlessTracking && policyDecision.decisionType === 'AUTO_APPROVED') {
            return {
                ...policyDecision,
                optimizedHoldDays: 1, // Extremely fast payout for trusted flawless tracking
                reasoning: "Tracking perfection combined with Very Low Risk."
            };
        }

        return policyDecision;
    }
}
