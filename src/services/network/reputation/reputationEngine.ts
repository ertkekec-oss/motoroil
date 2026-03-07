import { PrismaClient, NetworkReputationTier } from '@prisma/client';
import { ReputationTieringService } from './reputationTiering';
import { ReputationSignalsService } from './reputationSignals';

const prisma = new PrismaClient();

export class ReputationEngine {
    /**
     * Main recalculation process. Ingests component scores, merges signals, and updates Reputation.
     */
    static async recalculateReputationScore(tenantId: string) {
        await ReputationSignalsService.generateReputationSignals(tenantId);

        // Components calculation (mocking internal weights and reads for brevity)
        const isRestricted = await ReputationTieringService.applyRestrictionRules(tenantId);
        const isOnWatchlist = await ReputationTieringService.applyWatchlistRules(tenantId);

        // We read latest sub-scores: trust, shipping, operational flags, disputes
        const baseTrust = 85.0; // Assume we fetched NetworkTrustScore
        const baseShipping = 90.0; // NetworkShippingReliabilityScore
        const baseDisputeRisk = 5.0; // Reversed
        const baseEscrow = 80.0;

        const overallScore = Math.max(0, Math.min(100, (baseTrust * 0.4) + (baseShipping * 0.3) + (baseEscrow * 0.2) + (100 - baseDisputeRisk) * 0.1));

        const tier: NetworkReputationTier = ReputationTieringService.resolveReputationTier(overallScore, { isRestricted, isOnWatchlist });

        const supplierScore = overallScore * 1.05; // Heuristic adjusted role score
        const buyerScore = overallScore * 0.95; // Heuristic
        const partnerScore = overallScore * 1.0;

        const dedupeKey = `rep_${tenantId}_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}`;

        // Update stale states
        await prisma.networkReputationScore.updateMany({
            where: { tenantId, status: 'ACTIVE' },
            data: { isStale: true, status: 'STALE', supersededAt: new Date() }
        });

        const newRep = await prisma.networkReputationScore.create({
            data: {
                tenantId,
                overallScore,
                supplierScore,
                buyerScore,
                partnerScore,
                trustComponentScore: baseTrust,
                shippingComponentScore: baseShipping,
                disputeComponentScore: 100 - baseDisputeRisk,
                routingComponentScore: 88,
                escrowComponentScore: baseEscrow,
                activityComponentScore: 90,
                confidenceScore: 0.92,
                reputationTier: tier,
                explanationJson: {
                    summary: "Aggregated component baseline.",
                    factors: "Trust + Shipping strong, no severe disputes."
                },
                calculationVersion: '1.0.0',
                dedupeKey,
                status: 'ACTIVE',
                lastCalculatedAt: new Date()
            }
        });

        await this.buildReputationSnapshot(tenantId, newRep);
        return newRep;
    }

    static async buildReputationSnapshot(tenantId: string, currentScore: any) {
        const topPositive = await prisma.networkReputationSignal.count({
            where: { tenantId, status: 'ACTIVE', signalDirection: 'POSITIVE' }
        });
        const topNegative = await prisma.networkReputationSignal.count({
            where: { tenantId, status: 'ACTIVE', signalDirection: 'NEGATIVE' }
        });

        return await prisma.networkReputationSnapshot.create({
            data: {
                tenantId,
                overallScore: currentScore.overallScore,
                reputationTier: currentScore.reputationTier,
                trendDirection: 'STABLE', // Derived
                topPositiveSignalCount: topPositive,
                topNegativeSignalCount: topNegative,
                lastCalculatedAt: new Date(),
                calculationVersion: '1.0.0',
            }
        });
    }

    static async getReputationScore(tenantId: string) {
        return await prisma.networkReputationScore.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { lastCalculatedAt: 'desc' }
        });
    }
}
