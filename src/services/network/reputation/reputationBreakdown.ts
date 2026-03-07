import { PrismaClient } from '@prisma/client';
import { ReputationEngine } from './reputationEngine';

const prisma = new PrismaClient();

export class ReputationBreakdownService {
    static async buildReputationBreakdown(tenantId: string) {
        const score = await ReputationEngine.getReputationScore(tenantId);
        if (!score) return null;

        const signals = await prisma.networkReputationSignal.findMany({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { scoreImpact: 'desc' },
            take: 10
        });

        const positiveSignals = signals.filter(s => s.signalDirection === 'POSITIVE');
        const negativeSignals = signals.filter(s => s.signalDirection === 'NEGATIVE');

        return {
            overallRank: score.reputationTier,
            confidence: score.confidenceScore,
            components: {
                trust: score.trustComponentScore,
                shipping: score.shippingComponentScore,
                disputeResilience: score.disputeComponentScore,
                activity: score.activityComponentScore,
                escrowReliability: score.escrowComponentScore
            },
            roleScores: {
                supplier: score.supplierScore,
                buyer: score.buyerScore,
                partner: score.partnerScore
            },
            drivingFactors: {
                topPositives: positiveSignals.map(s => s.summary),
                topNegatives: negativeSignals.map(s => s.summary)
            },
            explanationJson: score.explanationJson,
            updatedAt: score.lastCalculatedAt
        };
    }
}
