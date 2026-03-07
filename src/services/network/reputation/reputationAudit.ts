import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationAuditService {
    /**
     * Records reputation changes and explicit admin commands to the general audit or graph log.
     * Since network reputation doesn't have an explicit table for audits in the new Phase 13 domain model requirements (beyond snapshot),
     * we will utilize generic logging or placeholder for explicit audit extensions. 
     */
    static recordReputationComputation(tenantId: string, result: any, durationMs: number) {
        console.log(`[REPUTATION_AUDIT] Tenant=${tenantId} Score=${result.overallScore} tier=${result.reputationTier} processed in ${durationMs}ms`);
    }

    static recordTierChange(tenantId: string, oldTier: string, newTier: string) {
        console.log(`[REPUTATION_AUDIT] Tenant=${tenantId} Tier Change: ${oldTier} -> ${newTier}`);
    }

    static recordWatchlistTrigger(tenantId: string, reasons: string[]) {
        console.warn(`[REPUTATION_AUDIT] Tenant=${tenantId} entered WATCHLIST. reasons=${reasons.join(',')}`);
    }

    static recordManualRestriction(tenantId: string, adminId: string, reason: string) {
        console.warn(`[REPUTATION_AUDIT] Tenant=${tenantId} RESTRICTED manually by Admin=${adminId} for reason: ${reason}`);
    }
}
