import prisma from "@/lib/prisma";
import { rebuildCanonicalProductCluster } from "@/domains/product-intelligence/services/productCluster.service";

/**
 * Worker Job: rebuild-product-clusters
 * Queue: product-intelligence
 */
export async function processRebuildProductClustersJob() {
    try {
        const canonicals = await prisma.canonicalProduct.findMany({ select: { id: true } });

        let processed = 0;
        for (const canonical of canonicals) {
            await rebuildCanonicalProductCluster(canonical.id);
            processed++;
        }

        console.log(`Rebuild complete: Processed ${processed} canonical products.`);
    } catch (error) {
        console.error(`Failed to rebuild product clusters:`, error);
        throw error;
    }
}
