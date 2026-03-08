import prisma from "@/lib/prisma";
import { calculateProductSimilarity } from "../utils/productSimilarity";
import { findOrCreateClusterForCanonical } from "./productCluster.service";
import { directMapTenantProductToCanonical } from "./canonicalProduct.service";

const CONSTANTS = {
    HIGH_CONFIDENCE: 0.92,
    REVIEW_THRESHOLD: 0.75,
};

export async function storeSimilarityRecord(params: {
    tenantProductMappingId?: string;
    canonicalProductId: string;
    comparedName: string;
    normalizedName: string;
    similarityScore: number;
    matchType: string;
}) {
    const cluster = await findOrCreateClusterForCanonical(params.canonicalProductId);

    return prisma.productSimilarity.create({
        data: {
            tenantProductMappingId: params.tenantProductMappingId || null,
            canonicalProductId: params.canonicalProductId,
            comparedName: params.comparedName,
            normalizedName: params.normalizedName,
            similarityScore: params.similarityScore,
            matchType: params.matchType,
            clusterId: cluster.id,
        },
    });
}

export async function findBestCanonicalMatches(input: {
    tenantId: string;
    productId: string;
    name: string;
    limit?: number;
}) {
    const canonicalProducts = await prisma.canonicalProduct.findMany({ take: 1000 });

    let bestMatches = [];

    for (const canonical of canonicalProducts) {
        const similarity = calculateProductSimilarity(input.name, canonical.name);

        if (similarity.finalScore >= 0.5) {
            bestMatches.push({
                canonicalProductId: canonical.id,
                canonicalName: canonical.name,
                score: similarity.finalScore,
                matchType: similarity.matchType,
                normalizedName: similarity.normalizedA,
            });
        }
    }

    bestMatches.sort((a, b) => b.score - a.score);
    return bestMatches.slice(0, input.limit || 5);
}

export async function compareTenantProductToCanonical(params: {
    tenantId: string;
    productId: string;
    productName: string;
}) {
    const matches = await findBestCanonicalMatches({
        tenantId: params.tenantId,
        productId: params.productId,
        name: params.productName,
        limit: 1, // Get top 1 match
    });

    if (matches.length > 0) {
        const topMatch = matches[0];

        // High Confidence -> Automap using canonicalProduct.service.ts helper
        if (topMatch.score >= CONSTANTS.HIGH_CONFIDENCE) {
            const mapping = await directMapTenantProductToCanonical(
                params.tenantId,
                params.productId,
                topMatch.canonicalProductId,
                topMatch.score
            );

            await storeSimilarityRecord({
                tenantProductMappingId: mapping.id,
                canonicalProductId: topMatch.canonicalProductId,
                comparedName: params.productName,
                normalizedName: topMatch.normalizedName,
                similarityScore: topMatch.score,
                matchType: topMatch.matchType,
            });

            return { action: 'AUTO_MAPPED', match: topMatch, mappingId: mapping.id };
        } else if (topMatch.score >= CONSTANTS.REVIEW_THRESHOLD) {
            // Suggestion
            const suggestion = await prisma.productMatchSuggestion.create({
                data: {
                    tenantId: params.tenantId,
                    productId: params.productId,
                    canonicalProductId: topMatch.canonicalProductId,
                    suggestedScore: topMatch.score,
                }
            });

            return { action: 'SUGGESTED', match: topMatch, suggestionId: suggestion.id };
        }
    }

    return { action: 'NO_STRONG_MATCH' };
}
