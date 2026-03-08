import prisma from "@/lib/prisma";
import { findOrCreateCanonicalProduct, mapTenantProductToCanonical, directMapTenantProductToCanonical } from "@/domains/product-intelligence/services/canonicalProduct.service";

/**
 * Worker Job: map-tenant-product
 * Queue: product-intelligence
 * Purpose: Matches a tenant product to a canonical product.
 */
export async function processMapTenantProductJob(data: { tenantId: string; productId: string; productName: string }) {
    try {
        const canonicalProduct = await findOrCreateCanonicalProduct(data.productName);

        await directMapTenantProductToCanonical(
            data.tenantId,
            data.productId,
            canonicalProduct.id,
            0.9
        );


        console.log(`Successfully mapped product ${data.productId} for tenant ${data.tenantId} to canonical ${canonicalProduct.id}`);
    } catch (error) {
        console.error(`Failed to map product ${data.productId} for tenant ${data.tenantId}:`, error);
        throw error;
    }
}
