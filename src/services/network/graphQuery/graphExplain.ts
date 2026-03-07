import { CompanyGraphNeighborhoodSnapshot, CompanyGraphClusterSnapshot } from '@prisma/client';

export class GraphExplainService {
    /**
     * Translates internal graph scores to human-readable tags and explanations.
     */
    static explainNeighborhoodResult(result: CompanyGraphNeighborhoodSnapshot | null) {
        if (!result) return { summary: 'No graph data found.', tags: [] };

        const tags: string[] = [];
        if (result.hopDistance === 1) tags.push('DIRECT_RELATIONSHIP');
        if ((result.avgTrustScore ?? 0) > 80) tags.push('HIGH_TRUST_NEIGHBORHOOD');
        if ((result.avgShippingReliability ?? 0) > 90) tags.push('STRONG_SHIPPING_RELIABILITY');

        return {
            summary: `You have ${result.totalReachableNodes} companies reachable within ${result.hopDistance} hops.`,
            tags,
            trustLevel: result.avgTrustScore,
            reliabilityLevel: result.avgShippingReliability
        };
    }

    static explainClusterResult(cluster: CompanyGraphClusterSnapshot | null) {
        if (!cluster) return { summary: 'Cluster unseen.', tags: [] };

        const tags: string[] = [];
        if (cluster.categoryId) tags.push('CATEGORY_CLUSTER_MATCH');
        if (cluster.regionCode) tags.push('REGIONALLY_RELEVANT');
        if (cluster.activeBuyerCount > cluster.activeSupplierCount) {
            tags.push('ACTIVE_BUYER_CLUSTER');
        } else {
            tags.push('ACTIVE_SUPPLIER_CLUSTER');
        }

        return {
            summary: `Dense trade network focused in ${cluster.regionCode || 'global scope'} impacting ${cluster.clusterSize} nodes.`,
            tags,
            densityScore: cluster.relationshipDensityScore,
            growthScore: cluster.growthScore
        };
    }

    static buildGraphReasonTags(node: any) {
        // Generate explanation based on capability, trust, or shipping
        return ['STRONG_MUTUAL_NETWORK'];
    }
}
