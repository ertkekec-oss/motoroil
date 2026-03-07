import { CompanyGraphNeighborhoodSnapshot, CompanyGraphClusterSnapshot } from '@prisma/client';

export class TenantGraphProjection {
    static projectNeighborhoodSummary(snap: CompanyGraphNeighborhoodSnapshot | null, explanation: any) {
        if (!snap) return null;
        return {
            hopDistance: snap.hopDistance,
            totalReachableNodes: snap.totalReachableNodes,
            directSupplierCount: snap.directSupplierCount,
            directBuyerCount: snap.directBuyerCount,
            relevanceExplanation: explanation?.summary || 'Connected via direct active trades.',
            tags: explanation?.tags || [],
            lastUpdated: snap.lastCalculatedAt.toISOString()
        };
    }

    static projectSupplierNeighborhood(suppliers: any[]) {
        // Strips private ERP data, reveals safe proximity data
        return suppliers.map(s => ({
            supplierId: s.sourceTenantId,
            relationStatus: s.status,
            health: s.healthStatus,
            lastActivity: s.lastActivityAt
        }));
    }

    static projectClusterDiscovery(cluster: CompanyGraphClusterSnapshot | null) {
        if (!cluster) return null;
        return {
            clusterKey: cluster.clusterKey,
            regionScope: cluster.regionCode || 'GLOBAL',
            categoryScope: cluster.categoryId || 'ALL',
            size: cluster.clusterSize,
            densityRelevance: cluster.categoryDensityScore * cluster.relationshipDensityScore,
            insight: cluster.explanationJson
        };
    }
}
