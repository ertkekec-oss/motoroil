import prisma from "@/lib/prisma";
import { meiliClient, INDEX_CANONICAL_PRODUCTS } from "@/lib/meilisearch";
import { tokenizeProductName } from "@/domains/product-intelligence/utils/productTokenization";

export async function processIndexCanonicalProductsJob() {
    try {
        const canonicals = await prisma.canonicalProduct.findMany({
            include: {
                ProductCluster: { take: 1 }
            }
        });

        console.log(`Preparing to index ${canonicals.length} canonical products...`);

        try {
            const index = meiliClient.index(INDEX_CANONICAL_PRODUCTS);
            await index.updateFilterableAttributes(['taxonomyNodeId', 'brand', 'clusterId']);
            await index.updateSearchableAttributes(['name', 'normalizedName', 'tokens', 'brand']);

            const documents = canonicals.map(c => ({
                id: c.id,
                name: c.name,
                normalizedName: c.normalizedName,
                brand: c.brand,
                taxonomyNodeId: c.taxonomyNodeId,
                clusterId: c.ProductCluster?.[0]?.id || null,
                tokens: tokenizeProductName(c.name)
            }));

            if (documents.length > 0) {
                await index.addDocuments(documents);
                console.log(`Indexed ${documents.length} canonical products.`);
            }
        } catch (error) {
            console.warn("Meilisearch indexing failed (is it running locally?). Skipping push.");
        }
    } catch (error) {
        console.error("Job failed: processIndexCanonicalProductsJob", error);
    }
}
