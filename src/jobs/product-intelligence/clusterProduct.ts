import { findOrCreateClusterForCanonical } from "@/domains/product-intelligence/services/productCluster.service";

/**
 * Worker Job: cluster-product
 * Queue: product-intelligence
 */
export async function processClusterProductJob(data: { canonicalProductId: string }) {
    try {
        const cluster = await findOrCreateClusterForCanonical(data.canonicalProductId);
        console.log(`Clustered Canonical Product ${data.canonicalProductId} -> Cluster ${cluster.clusterKey}`);
    } catch (error) {
        console.error(`Failed to cluster canonical product ${data.canonicalProductId}:`, error);
        throw error;
    }
}
