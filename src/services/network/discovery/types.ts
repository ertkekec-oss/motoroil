import { BoostScope, SellerRiskTier } from '@prisma/client';

export type SortMode = 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'LEADTIME_ASC' | 'TRUST_DESC';

export interface DiscoveryFilters {
    categoryId?: string;
    brandId?: string;
    priceMin?: number;
    priceMax?: number;
    inStockOnly?: boolean;
    leadTimeMax?: number;
    sellerTierMin?: SellerRiskTier;
}

export interface RankParams {
    viewerTenantId: string;
    filters: DiscoveryFilters;
    sortMode: SortMode;
    cursor?: string;
    limit?: number;
    requestId?: string;
}

export interface BoostMultiplier {
    multiplier: number;
    ruleId: string;
    scope: BoostScope;
}

export interface ExplainabilityRecord {
    trustTier: SellerRiskTier;
    trustScoreUsed: number;
    baseScore: {
        trustScoreNorm: number;
        recencyNorm: number;
        availabilityNorm: number;
        priceCompetitivenessNorm: number;
        leadTimeNorm: number;
        matchNorm: number;
    };
    rawBaseScore: number;
    boosted: boolean;
    boostMultiplier: number;
    finalScore: number;
    topReasons: string[];
    isSponsored: boolean;
}

export interface DiscoveryResultItem {
    listingId: string;
    globalProductId: string;
    title: string;
    categoryId: string;
    brandId: string | null;
    unitPrice: number;
    currency: string;
    availableQty: number;
    minOrderQty: number;
    leadTimeDays: number;
    sellerTier: SellerRiskTier;
    isSponsored: boolean;
    reasonJson?: any;
    scoreBreakdown?: ExplainabilityRecord;
}

export interface RankResult {
    results: DiscoveryResultItem[];
    nextCursor?: string;
}
