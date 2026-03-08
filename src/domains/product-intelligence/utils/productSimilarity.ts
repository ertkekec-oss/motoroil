import { normalizeProductName } from "./productNormalization";
import { tokenizeProductName, extractBrandToken, extractNumericTokens, extractAlphaNumericSkuTokens } from "./productTokenization";

export function calculateProductSimilarity(a: string, b: string): {
    normalizedA: string;
    normalizedB: string;
    tokenOverlapScore: number;
    numericTokenScore: number;
    brandScore: number;
    finalScore: number;
    matchType: string;
} {
    const normalizedA = normalizeProductName(a);
    const normalizedB = normalizeProductName(b);

    if (normalizedA === normalizedB) {
        return {
            normalizedA,
            normalizedB,
            tokenOverlapScore: 1.0,
            numericTokenScore: 1.0,
            brandScore: 1.0,
            finalScore: 1.0,
            matchType: "EXACT",
        };
    }

    const tokensA = tokenizeProductName(a);
    const tokensB = tokenizeProductName(b);

    // Token Overlap
    const setA = new Set(tokensA);
    const intersection = tokensB.filter(t => setA.has(t));
    const tokenOverlapScore = intersection.length / Math.max(tokensA.length, tokensB.length, 1);

    // Numeric Overlap (Crucial for parts: e.g. "6203")
    const numsA = extractNumericTokens(a);
    const numsB = extractNumericTokens(b);
    let numericTokenScore = 0;
    if (numsA.length > 0 || numsB.length > 0) {
        const numIntersection = numsB.filter(n => numsA.includes(n));
        numericTokenScore = numIntersection.length / Math.max(numsA.length, numsB.length, 1);
    } else {
        numericTokenScore = 0.5; // Neutral if no numbers
    }

    // Alphanumeric SKU overlaps 
    const skuA = extractAlphaNumericSkuTokens(a);
    const skuB = extractAlphaNumericSkuTokens(b);
    let skuScore = 0;
    if (skuA.length > 0 || skuB.length > 0) {
        const skuIntersection = skuB.filter(s => skuA.includes(s));
        skuScore = skuIntersection.length / Math.max(skuA.length, skuB.length, 1);
    }

    // Brand Match
    const brandA = extractBrandToken(a);
    const brandB = extractBrandToken(b);
    let brandScore = 0;
    if (brandA && brandB && brandA === brandB) {
        brandScore = 1.0;
    } else if (brandA && brandB && brandA !== brandB) {
        brandScore = -0.5; // Penalty
    }

    // Rule engine calculations
    let finalScore = (tokenOverlapScore * 0.4) + (numericTokenScore * 0.3) + (brandScore * 0.2) + (skuScore * 0.1);
    if (finalScore > 1.0) finalScore = 1.0;
    if (finalScore < 0) finalScore = 0;

    let matchType = "TEXT_SIMILAR";

    if (skuScore > 0.8 && numericTokenScore > 0.8) {
        matchType = "SKU_SIMILAR";
    } else if (brandScore === 1.0 && numericTokenScore > 0.8) {
        matchType = "BRAND_MATCH";
    } else if (brandScore === 1.0 && tokenOverlapScore > 0.7) {
        matchType = "BRAND_MATCH";
    }

    if (skuScore === 1 && brandScore === 1 && numericTokenScore === 1) {
        finalScore = Math.max(0.95, finalScore); // Boost for very strong pattern matches
    }

    return {
        normalizedA,
        normalizedB,
        tokenOverlapScore,
        numericTokenScore,
        brandScore,
        finalScore,
        matchType,
    };
}
