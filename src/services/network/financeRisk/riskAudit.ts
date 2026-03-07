import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RiskAuditService {
    /**
     * Records risk recomputations for observability.
     */
    static recordRiskComputation(contextType: string, id: string | null, score: any, durationMs: number) {
        console.log(`[RISK_AUDIT] Context=${contextType} ID=${id} Score=${score.overallRiskScore} Tier=${score.riskTier} processed in ${durationMs}ms`);
    }

    /**
     * Audits escrow policy changes and decisions.
     */
    static recordEscrowPolicyDecision(escrowHoldId: string, decision: any) {
        console.log(`[RISK_AUDIT] Policy for Escrow=${escrowHoldId} Mode=${decision.decisionType} Holds=${decision.holdDays} days`);
    }

    /**
     * Alert logic for significant risk regressions or manual holds.
     */
    static recordRiskTierChange(tenantId: string, oldTier: string, newTier: string) {
        console.warn(`[RISK_AUDIT] Tenant=${tenantId} Risk Tier Shift: ${oldTier} -> ${newTier}`);
    }
}
