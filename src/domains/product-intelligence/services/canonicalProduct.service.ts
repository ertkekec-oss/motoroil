import prisma from "@/lib/prisma";
import { normalizeProductName, extractBrand } from "../utils/productNormalization";
import { compareTenantProductToCanonical } from "./productSimilarity.service";

export async function findOrCreateCanonicalProduct(name: string, taxonomyNodeId?: string) {
    const normalizedName = normalizeProductName(name);
    const brand = extractBrand(name);

    let canonical = await prisma.canonicalProduct.findFirst({
        where: { normalizedName },
    });

    if (!canonical) {
        canonical = await prisma.canonicalProduct.create({
            data: {
                name,
                normalizedName,
                brand,
                taxonomyNodeId,
            },
        });
    }

    return canonical;
}

export async function directMapTenantProductToCanonical(tenantId: string, productId: string, canonicalProductId: string, confidenceScore: number = 1.0) {
    let mapping = await prisma.tenantProductMapping.findFirst({
        where: {
            tenantId,
            productId,
        },
    });

    if (mapping) {
        return prisma.tenantProductMapping.update({
            where: { id: mapping.id },
            data: {
                canonicalProductId,
                confidenceScore,
            },
        });
    }

    return prisma.tenantProductMapping.create({
        data: {
            tenantId,
            productId,
            canonicalProductId,
            confidenceScore,
        },
    });
}

export async function mapTenantProductToCanonical(tenantId: string, productId: string, productName: string) {
    // As per phase 2, use similarity service
    const result = await compareTenantProductToCanonical({ tenantId, productId, productName });

    // Fallback: If no match was strong enough, create a canonical for it and direct map.
    // OR we can just return the result (which creates PENDING suggestion).
    if (result.action === 'NO_STRONG_MATCH') {
        const canonical = await findOrCreateCanonicalProduct(productName);
        const mapping = await directMapTenantProductToCanonical(tenantId, productId, canonical.id, 0.9);
        return { action: 'CREATED_AND_MAPPED', mappingId: mapping.id };
    }

    return result;
}

export async function getCanonicalProduct(id: string) {
    return prisma.canonicalProduct.findUnique({
        where: { id },
        include: {
            taxonomyNode: true,
            tenantMappings: true,
        },
    });
}
