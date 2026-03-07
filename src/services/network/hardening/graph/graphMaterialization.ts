import { recomputeAdjacencyForTenant } from './adjacencyCache';
import { recomputeGraphMetrics } from './graphMetrics';

export async function warmGraphCaches(tenantIds: string[]) {
    for (const tenantId of tenantIds) {
        await recomputeAdjacencyForTenant(tenantId);
        await recomputeGraphMetrics(tenantId);
    }
}
