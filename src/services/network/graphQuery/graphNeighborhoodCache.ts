import { PrismaClient } from '@prisma/client';
import { NeighborhoodService } from './neighborhoodService';
import { ClusterDiscoveryService } from './clusterDiscovery';

const prisma = new PrismaClient();

export class GraphNeighborhoodCache {
    /**
     * Stale graph rebuild logic.
     */
    static async recomputeNeighborhoodSnapshot(tenantId: string, scope: '1-HOP' | '2-HOP' | '3-HOP' = '1-HOP') {
        const hopDistance = parseInt(scope.split('-')[0]) || 1;

        // Invalidate previous cache
        await prisma.companyGraphNeighborhoodSnapshot.updateMany({
            where: { tenantId, hopDistance, status: 'ACTIVE' },
            data: {
                isStale: true,
                status: 'STALE',
                supersededAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Regenerate new
        return await NeighborhoodService.buildNeighborhoodSnapshot(tenantId, scope, {});
    }

    static async recomputeClusterSnapshots(scope: { type: 'CATEGORY' | 'REGION', categoryId?: string, regionCode?: string }) {
        // Fallback logic for invalidation and recreation
        // Assume ClusterDiscovery logic updates the same dedupe key for today or creates new versions.
        return await ClusterDiscoveryService.buildClusterSnapshot(scope);
    }

    static async invalidateNeighborhoodCache(tenantId: string, reason: string) {
        return await prisma.companyGraphNeighborhoodSnapshot.updateMany({
            where: { tenantId, status: 'ACTIVE' },
            data: { isStale: true, explanationJson: { invalidatedBecause: reason } }
        });
    }

    static async invalidateClusterCache(regionCode: string, reason: string) {
        return await prisma.companyGraphClusterSnapshot.updateMany({
            where: { regionCode, status: 'ACTIVE' },
            data: { isStale: true }
        });
    }
}
