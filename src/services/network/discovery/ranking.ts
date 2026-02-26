import { PrismaClient, SellerRiskTier, BoostScope } from '@prisma/client';
import { RankParams, RankResult, DiscoveryResultItem, ExplainabilityRecord } from './types';
import { fetchActiveBoosts } from './boosts';
import { logDiscoveryImpressions } from './impressions';

const prisma = new PrismaClient();

// Tunable constants
const W_TRUST = 0.35;
const W_RECENCY = 0.10;
const W_AVAILABILITY = 0.15;
const W_PRICE = 0.25;
const W_LEAD = 0.10;
const W_MATCH = 0.05;

export async function rankNetworkListings(params: RankParams): Promise<RankResult> {
    const { filters, viewerTenantId, sortMode, limit = 20 } = params;

    // 1. Prepare Base Query (Safe Tenant Isolation -> ONLY NETWORK VISIBLE)
    let whereClause: any = {
        visibility: 'NETWORK',
        status: 'ACTIVE'
    };

    if (filters.categoryId) {
        whereClause.globalProduct = { ...whereClause.globalProduct, categoryId: filters.categoryId };
    }

    if (filters.inStockOnly) {
        whereClause.availableQty = { gt: 0 };
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        whereClause.price = {};
        if (filters.priceMin !== undefined) whereClause.price.gte = filters.priceMin;
        if (filters.priceMax !== undefined) whereClause.price.lte = filters.priceMax;
    }

    if (filters.leadTimeMax !== undefined) {
        whereClause.leadTimeDays = { lte: filters.leadTimeMax };
    }

    // 2. Fetch Raw Listings
    // Typically you would fetch cursor pages. But for ranking scoring we might need to fetch a sufficient batch, 
    // compute scores, and return top limit. If dataset is huge, a DB level scoring/ElasticSearch is required.
    // Since we're requested Prisma deterministic ranking, we will fetch a larger batch, sort in JS, and paginate in JS,
    // OR just use DB sorting for standard queries and only inject explainability.
    // For pure custom ranking logic in code (as requested), we grab up to 500 items to score.
    const rawListings = await prisma.networkListing.findMany({
        where: whereClause,
        take: 500, // Safe bound for in-mem score
        include: {
            globalProduct: {
                select: {
                    id: true,
                    name: true,
                    categoryId: true,
                }
            },
            company: {
                select: {
                    id: true,
                    sellerTrustScore: {
                        select: {
                            score: true,
                            tier: true
                        }
                    }
                }
            }
        }
    });

    // 3. Filter further by Trust Tier if required
    let listings = rawListings;
    if (filters.sellerTierMin) {
        const tierWeights: Record<SellerRiskTier, number> = { A: 4, B: 3, C: 2, D: 1 };
        const reqTier = tierWeights[filters.sellerTierMin];
        listings = rawListings.filter(l => {
            const t = l.company.sellerTrustScore?.tier || 'C';
            return tierWeights[t] >= reqTier;
        });
    }

    // 4. Fetch Boosts
    const activeBoosts = await fetchActiveBoosts();

    // 5. Score items
    const scoredItems: { listing: typeof listings[0]; cScore: ExplainabilityRecord }[] = listings.map(listing => {
        // --- A. Trust Signal
        const tScoreRaw = listing.company.sellerTrustScore?.score || 60; // Default C avg
        const tTier = listing.company.sellerTrustScore?.tier || 'C';
        const trustScoreNorm = tScoreRaw / 100;

        // --- B. Recency Signal (Mocked via createdAt decay / days since)
        const daysOld = Math.max(0, (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const recencyNorm = Math.max(0, 1 - (daysOld / 365));

        // --- C. Availability Signal
        const availabilityNorm = listing.availableQty > 0 ? Math.min(1, Math.log10(listing.availableQty) / 4) : 0; // Cap at 10k items

        // --- D. Price Competitiveness
        // Stub: Normally we calculate category median.
        const priceCompetitivenessNorm = 0.5;

        // --- E. Lead Time
        const leadTimeNorm = 1 / (1 + listing.leadTimeDays);

        // --- F. Metadata Match
        const matchNorm = 1.0;

        // Calculate Base
        const rawBaseScore =
            (W_TRUST * trustScoreNorm) +
            (W_RECENCY * recencyNorm) +
            (W_AVAILABILITY * availabilityNorm) +
            (W_PRICE * priceCompetitivenessNorm) +
            (W_LEAD * leadTimeNorm) +
            (W_MATCH * matchNorm);

        // --- Boost Calculation
        let boostMultiplier = 1.0;
        let isBoosted = false;

        // Check boosts if seller is not Tier D
        if (tTier !== 'D') {
            for (const boost of activeBoosts) {
                let hit = false;
                if (boost.scope === 'LISTING' && boost.targetId === listing.id) hit = true;
                if (boost.scope === 'SELLER' && boost.targetId === listing.company.id) hit = true;
                if (boost.scope === 'CATEGORY' && boost.targetId === listing.globalProduct.categoryId) hit = true;

                if (hit) {
                    boostMultiplier = Math.max(boostMultiplier, Number(boost.multiplier));
                    isBoosted = true;
                }
            }
        }

        const finalScore = rawBaseScore * boostMultiplier;

        // --- Explainability Strings
        const reasons = [];
        if (tTier === 'A') reasons.push('Highly Trusted Seller');
        if (isBoosted) reasons.push('Promoted Result');
        if (listing.leadTimeDays === 0) reasons.push('Same Day Dispatch');

        return {
            listing,
            cScore: {
                trustTier: tTier,
                trustScoreUsed: tScoreRaw, // Safe derived internal snapshot, not entire componentsJson
                baseScore: { trustScoreNorm, recencyNorm, availabilityNorm, priceCompetitivenessNorm, leadTimeNorm, matchNorm },
                rawBaseScore,
                boosted: isBoosted,
                boostMultiplier,
                finalScore,
                topReasons: reasons.slice(0, 3)
            }
        };
    });

    // 6. Sorting 
    scoredItems.sort((a, b) => {
        if (sortMode === 'RELEVANCE') return b.cScore.finalScore - a.cScore.finalScore || a.listing.id.localeCompare(b.listing.id);
        if (sortMode === 'PRICE_ASC') return Number(a.listing.price) - Number(b.listing.price) || a.listing.id.localeCompare(b.listing.id);
        if (sortMode === 'PRICE_DESC') return Number(b.listing.price) - Number(a.listing.price) || a.listing.id.localeCompare(b.listing.id);
        if (sortMode === 'LEADTIME_ASC') return a.listing.leadTimeDays - b.listing.leadTimeDays || a.listing.id.localeCompare(b.listing.id);
        if (sortMode === 'TRUST_DESC') return b.cScore.trustScoreUsed - a.cScore.trustScoreUsed || a.listing.id.localeCompare(b.listing.id);
        return 0; // Deterministic tie-break always by ID
    });

    // 7. Cursor Pagination (Post-sort slice)
    let startIndex = 0;
    if (params.cursor) {
        const cid = scoredItems.findIndex(i => i.listing.id === params.cursor);
        if (cid > -1) startIndex = cid + 1;
    }

    const page = scoredItems.slice(startIndex, startIndex + limit);
    const nextCursor = page.length === limit && startIndex + limit < scoredItems.length ? page[page.length - 1].listing.id : undefined;

    // 8. Transform to Public Output (No PII / Private Fields)
    const results: DiscoveryResultItem[] = page.map(i => ({
        listingId: i.listing.id,
        globalProductId: i.listing.globalProductId,
        title: i.listing.globalProduct.name,
        categoryId: i.listing.globalProduct.categoryId,
        brandId: null,
        unitPrice: Number(i.listing.price),
        currency: 'TRY', // Standard for model
        availableQty: i.listing.availableQty,
        minOrderQty: i.listing.minQty,
        leadTimeDays: i.listing.leadTimeDays,
        sellerTier: i.cScore.trustTier,
        scoreBreakdown: i.cScore
    }));

    // 9. Fire and forget Impression Logic
    const impressionData = page.map((i, idx) => ({
        listingId: i.listing.id,
        position: startIndex + idx + 1,
        finalScore: i.cScore.finalScore,
        breakdown: i.cScore
    }));
    await logDiscoveryImpressions(viewerTenantId, impressionData);

    return { results, nextCursor };
}
