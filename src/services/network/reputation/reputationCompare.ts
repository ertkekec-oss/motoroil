import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationCompareService {
    /**
     * Finds the score delta between the current calculation and the immediate predecessor.
     */
    static async compareCurrentVsPrevious(tenantId: string) {
        const history = await prisma.networkReputationScore.findMany({
            where: { tenantId },
            orderBy: { lastCalculatedAt: 'desc' },
            take: 2
        });

        if (history.length < 2) return null;

        const current = history[0];
        const previous = history[1];

        const delta = current.overallScore - previous.overallScore;
        const tierChanged = current.reputationTier !== previous.reputationTier;

        return {
            delta,
            isUpgrade: delta > 0,
            isDowngrade: delta < 0,
            tierChanged,
            oldTier: previous.reputationTier,
            newTier: current.reputationTier
        };
    }

    static async buildReputationDelta(tenantId: string) {
        return await this.compareCurrentVsPrevious(tenantId);
    }
}
