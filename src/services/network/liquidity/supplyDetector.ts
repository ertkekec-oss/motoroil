import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SupplyCandidate {
    tenantId: string;
    categoryId?: string;
    productRef?: string;
    volumeScore: number;
    clusterId?: string;
    regionCode?: string;
}

export class SupplyDetector {
    /**
     * Detects supply surplus across the network by scanning inventory signals and overstock risks.
     */
    static async detectSupplySurplus(categoryId?: string, region?: string): Promise<SupplyCandidate[]> {
        const whereClause: any = {
            signalType: { in: ['OVERSTOCK', 'SLOW_MOVING'] },
            status: 'ACTIVE'
        };

        if (categoryId) whereClause.productCategoryId = categoryId;

        const signals = await prisma.networkInventorySignal.findMany({
            where: whereClause,
            take: 100, // Reasonable cap for processing loop
            orderBy: { confidenceScore: 'desc' }
        });

        // Use real data to map to SupplyCandidate
        return signals.map(sig => ({
            tenantId: sig.tenantId,
            categoryId: sig.productCategoryId,
            // Since we don't have canonical reference precisely mapped in Inventory Signal yet, we can omit productRef or map if available
            volumeScore: sig.velocityScore > 0 ? sig.velocityScore : 50, // default if velocity not properly set
            // Regions and Clusters would need profile joining later, for now we map defaults or from known sources
            regionCode: region || "TR-ALL",
            clusterId: "CLUSTER_GENERIC"
        }));
    }
}
