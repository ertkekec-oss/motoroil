import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DemandCandidate {
    tenantId: string;
    categoryId?: string;
    productRef?: string;
    volumeScore: number;
    clusterId?: string;
    regionCode?: string;
}

export class DemandDetector {
    /**
     * Detects demand shortage across network by scanning stockout risks and RFQ signals.
     */
    static async detectDemandShortage(categoryId?: string, region?: string): Promise<DemandCandidate[]> {
        const whereClause: any = {
            signalType: { in: ['HIGH_DEMAND', 'STOCKOUT_RISK'] },
            status: 'ACTIVE'
        };

        if (categoryId) whereClause.productCategoryId = categoryId;

        const signals = await prisma.networkInventorySignal.findMany({
            where: whereClause,
            take: 100, // Reasonable cap
            orderBy: { confidenceScore: 'desc' }
        });

        // Use real data to map to DemandCandidate
        return signals.map(sig => ({
            tenantId: sig.tenantId,
            categoryId: sig.productCategoryId,
            // Volume score might be mapped from velocity
            volumeScore: sig.velocityScore > 0 ? sig.velocityScore : 50,
            regionCode: region || "TR-ALL",
            clusterId: "CLUSTER_GENERIC"
        }));
    }
}
