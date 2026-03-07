import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClusterDiscoveryService {
    /**
     * Discovers category-based dense graph clusters.
     */
    static async discoverCategoryClusters(categoryId: string, filters: any = {}) {
        return await this.buildClusterSnapshot({ categoryId, type: 'CATEGORY' });
    }

    static async discoverRegionalClusters(regionCode: string, filters: any = {}) {
        return await this.buildClusterSnapshot({ regionCode, type: 'REGION' });
    }

    static async buildClusterSnapshot(scope: { categoryId?: string; regionCode?: string; type: 'CATEGORY' | 'REGION' }) {
        // Demo version simulating a full graph heuristic finding logic.
        const clusterKey = `cluster_${scope.type}_${scope.categoryId || 'all'}_${scope.regionCode || 'all'}`;
        const dedupeKey = `${clusterKey}_${new Date().toISOString().split('T')[0]}`;

        const existing = await prisma.companyGraphClusterSnapshot.findUnique({
            where: { dedupeKey }
        });

        if (existing) return existing;

        const clusterSize = 45; // Simulated nodes in cluster
        const avgTrustScore = 91.0;
        const avgShippingReliability = 89.4;

        return await prisma.companyGraphClusterSnapshot.create({
            data: {
                clusterKey,
                categoryId: scope.categoryId,
                regionCode: scope.regionCode,
                clusterSize,
                avgTrustScore,
                avgShippingReliability,
                activeSupplierCount: 25,
                activeBuyerCount: 20,
                categoryDensityScore: scope.categoryId ? 0.95 : 0.5,
                relationshipDensityScore: 0.88,
                growthScore: 0.12,
                explanationJson: {
                    keyInsights: "High volume of buyer-supplier transactions forming a stable region cluster."
                },
                calculationVersion: '1.0.0',
                dedupeKey,
                status: 'ACTIVE',
                lastCalculatedAt: new Date()
            }
        });
    }

    static async rankClusters(scope: 'CATEGORY' | 'REGION' | 'ALL') {
        return await prisma.companyGraphClusterSnapshot.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { relationshipDensityScore: 'desc' },
            take: 20
        });
    }
}
