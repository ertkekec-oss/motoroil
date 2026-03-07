import { ReputationEngine } from './reputationEngine';

export class ReputationFeedbackService {
    /**
     * Translates reputation tier/score into a discovery ranking boost factor.
     */
    static async buildDiscoveryReputationBoost(tenantId: string, context: any = {}) {
        const rep = await ReputationEngine.getReputationScore(tenantId);
        if (!rep || rep.reputationTier === 'NEW') return 1.0;
        if (rep.reputationTier === 'WATCHLIST' || rep.reputationTier === 'RESTRICTED') return 0.5;

        if (rep.reputationTier === 'PREMIUM') return 1.5;
        if (rep.reputationTier === 'HIGH_CONFIDENCE') return 1.3;
        if (rep.reputationTier === 'STABLE') return 1.1;

        return 1.0;
    }

    /**
     * Injects reputation context into Escrow/Dispute Strategy rules
     */
    static async buildEscrowReputationAdjustment(tenantId: string, context: any = {}) {
        const rep = await ReputationEngine.getReputationScore(tenantId);
        if (!rep) return { policy: 'STANDARD_HOLD' };

        if (rep.reputationTier === 'PREMIUM') {
            return { policy: 'ACCELERATED_RELEASE', deductionRisk: 'LOW', holdDays: 3 };
        }
        if (rep.reputationTier === 'WATCHLIST') {
            return { policy: 'STRICT_HOLD', deductionRisk: 'HIGH', holdDays: 21, requiresAdminRelease: true };
        }

        return { policy: 'STANDARD_HOLD', holdDays: 14 };
    }

    static async buildRoutingReputationAdjustment(tenantId: string, context: any = {}) {
        // Typically identical logic or slight variant for automated wave routing
        return await this.buildDiscoveryReputationBoost(tenantId, context);
    }
}
