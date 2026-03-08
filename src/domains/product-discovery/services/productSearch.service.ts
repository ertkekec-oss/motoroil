import { meiliClient, INDEX_CANONICAL_PRODUCTS, INDEX_SUPPLIER_PRODUCTS } from "@/lib/meilisearch";
import prisma from "@/lib/prisma";

export async function searchProducts(query: string, limit: number = 20) {
    try {
        const index = meiliClient.index(INDEX_CANONICAL_PRODUCTS);
        const searchRes = await index.search(query, { limit });
        return searchRes.hits;
    } catch (error) {
        console.warn("Meilisearch not available or index missing. Falling back to DB schema search.");
        return prisma.canonicalProduct.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            take: limit,
            include: { ProductCluster: true }
        });
    }
}

export async function searchProductsByCategory(categoryId: string, limit: number = 20) {
    try {
        const index = meiliClient.index(INDEX_CANONICAL_PRODUCTS);
        const searchRes = await index.search("", { filter: [`taxonomyNodeId = ${categoryId}`], limit });
        return searchRes.hits;
    } catch (error) {
        return prisma.canonicalProduct.findMany({
            where: { taxonomyNodeId: categoryId },
            take: limit,
            include: { ProductCluster: true }
        });
    }
}

export async function searchSupplierProducts(query: string, filter?: { tenantId?: string, brand?: string }, limit: number = 20) {
    try {
        const filters = [];
        if (filter?.tenantId) filters.push(`tenantId = ${filter.tenantId}`);
        if (filter?.brand) filters.push(`brand = ${filter.brand}`);

        const index = meiliClient.index(INDEX_SUPPLIER_PRODUCTS);
        const searchRes = await index.search(query, {
            filter: filters.length > 0 ? filters : undefined,
            limit,
        });
        return searchRes.hits;
    } catch (error) {
        console.warn("Meilisearch not available. Falling back to simple db mapping relation.");
        const where: any = {};
        if (filter?.tenantId) where.tenantId = filter.tenantId;

        const matches = await prisma.tenantProductMapping.findMany({
            where,
            take: limit,
            include: {
                canonicalProduct: true,
            }
        });

        return matches.map((m: any) => ({
            tenantId: m.tenantId,
            productId: m.productId,
            canonicalProductId: m.canonicalProductId,
            productName: m.canonicalProduct?.name,
            brand: m.canonicalProduct?.brand,
            confidenceScore: m.confidenceScore
        }));
    }
}

export async function autocompleteProducts(query: string, limit: number = 5) {
    const hits = await searchProducts(query, limit);
    const uniqueNames = Array.from(new Set(hits.map((h: any) => h.name)));
    return uniqueNames;
}

export async function searchSimilarProducts(canonicalProductId: string, limit: number = 10) {
    const canonical = await prisma.canonicalProduct.findUnique({
        where: { id: canonicalProductId },
        include: { ProductCluster: true }
    });

    if (!canonical || !canonical.ProductCluster || canonical.ProductCluster.length === 0) return [];

    const clusterId = canonical.ProductCluster[0].id;
    return getClusterProducts(clusterId, limit);
}

export async function getClusterProducts(clusterId: string, limit: number = 10) {
    const cluster = await prisma.productCluster.findUnique({
        where: { id: clusterId },
        include: {
            similarities: {
                include: {
                    canonicalProduct: true
                },
                take: limit
            }
        }
    });

    if (!cluster) return [];

    // Deduplicate and filter canonical products linked via similarities
    return cluster.similarities
        .map(sim => sim.canonicalProduct)
        .filter(p => p !== null);
}
