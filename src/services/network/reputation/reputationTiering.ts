import { NetworkReputationTier, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationTieringService {
    /**
     * Resolves a raw numeric score into an official classification tier.
     */
    static resolveReputationTier(score: number, context: any = {}): NetworkReputationTier {
        if (context.isRestricted) return 'RESTRICTED';
        if (context.isOnWatchlist) return 'WATCHLIST';

        if (score < 30) return 'NEW';
        if (score < 50) return 'DEVELOPING';
        if (score < 80) return 'STABLE';
        if (score < 95) return 'HIGH_CONFIDENCE';
        return 'PREMIUM';
    }

    static async applyWatchlistRules(tenantId: string): Promise<boolean> {
        // Check signals for heavy disputes or refunds that automatically trigger a watch
        const severeNegativeCount = await prisma.networkReputationSignal.count({
            where: {
                tenantId,
                status: 'ACTIVE',
                signalDirection: 'NEGATIVE',
                scoreImpact: { lte: -10 }
            }
        });

        return severeNegativeCount >= 3;
    }

    static async applyRestrictionRules(tenantId: string): Promise<boolean> {
        // Check if admin manually restricted or explicitly banned the tenant through signal
        const manualRestrictions = await prisma.networkReputationSignal.count({
            where: {
                tenantId,
                status: 'ACTIVE',
                signalType: 'ADMIN_RESTRICTION'
            }
        });
        return manualRestrictions > 0;
    }
}
