import prisma from "@/lib/prisma";
import { compareTenantProductToCanonical, storeSimilarityRecord } from "@/domains/product-intelligence/services/productSimilarity.service";

/**
 * Worker Job: normalize-product
 * Queue: product-intelligence
 */
export async function processNormalizeProductJob(data: { tenantId: string; productId: string; productName: string }) {
    try {
        const result = await compareTenantProductToCanonical({
            tenantId: data.tenantId,
            productId: data.productId,
            productName: data.productName,
        });

        console.log(`Normalize Product Job completed for ${data.productName} with action: ${result.action}`);
    } catch (error) {
        console.error(`Failed to normalize product ${data.productId} for tenant ${data.tenantId}:`, error);
        throw error;
    }
}
