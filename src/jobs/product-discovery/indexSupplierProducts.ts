import prisma from "@/lib/prisma";
import { meiliClient, INDEX_SUPPLIER_PRODUCTS } from "@/lib/meilisearch";

export async function processIndexSupplierProductsJob() {
    try {
        const tenantProducts = await prisma.tenantProductMapping.findMany({
            take: 1000,
            include: {
                canonicalProduct: true
            }
        });

        console.log(`Preparing to index ${tenantProducts.length} supplier products...`);

        try {
            const index = meiliClient.index(INDEX_SUPPLIER_PRODUCTS);
            await index.updateFilterableAttributes(['tenantId', 'brand', 'taxonomyNodeId']);
            await index.updateSearchableAttributes(['productName', 'brand']);

            const documents = tenantProducts.map((tp, idx) => ({
                id: tp.id, // Primary key
                tenantId: tp.tenantId,
                productId: tp.productId,
                canonicalProductId: tp.canonicalProductId,
                productName: tp.canonicalProduct?.name || 'Unknown',
                brand: tp.canonicalProduct?.brand || null,
                availableQuantity: 999, // Simulated stock, 
                price: 99.00, // Simulated price
                taxonomyNodeId: tp.canonicalProduct?.taxonomyNodeId || null
            }));

            if (documents.length > 0) {
                await index.addDocuments(documents);
                console.log(`Indexed ${documents.length} supplier products.`);
            }
        } catch (error) {
            console.warn("Meilisearch indexing failed (is it running locally?). Skipping push.");
        }
    } catch (error) {
        console.error("Job failed: processIndexSupplierProductsJob", error);
    }
}
