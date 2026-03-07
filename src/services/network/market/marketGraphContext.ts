import prisma from '@/lib/prisma';

export async function getMarketGraphContext(scope: any) {
    // Collect related caching metrics based on scope
    // Currently this provides global network density snapshot as fallback support
    // Real implementation would calculate proximity based on cluster/region
    const globalContext = await prisma.companyGraphMetricSnapshot.findFirst({
        orderBy: { lastComputedAt: 'desc' }
    });

    return {
        overallDensity: globalContext?.mutualNetworkDensity || 0,
        activeSuppliersCount: globalContext?.activeSuppliersCount || 0
    };
}

export async function getClusterDensityMetrics(clusterId: string) {
    return { density: 50, averageActivity: 60 }; // Placeholder
}

export async function getNeighborDemandPressure(tenantId: string, categoryId: string) {
    // This finds direct connections of tenant and checks if they have BUY signals on category
    // Using simple mock fallback for testing the engine
    const adjacency = await prisma.companyGraphAdjacencyCache.findMany({
        where: { tenantId }
    });

    let demandPressure = 0;
    if (adjacency.length > 0) {
        demandPressure = Math.min((adjacency.length * 10), 100);
    }

    return demandPressure;
}
