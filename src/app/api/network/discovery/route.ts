import { NextRequest, NextResponse } from "next/server";
import { rankNetworkListings } from "@/services/network/discovery/ranking";
import { getSession } from "@/lib/auth"; // Adjust to standard method
import { DiscoveryFilters, SortMode, DiscoveryResultItem } from "@/services/network/discovery/types";
import { logDiscoveryRequest, generateQueryHash } from "@/services/network/discovery/observability";
import { randomUUID } from "crypto";

// Minimal In-Memory Token Bucket for 60 rq/min per Tenant
const limitCache = new Map<string, { count: number, resetAt: number }>();

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

        // --- 1. Query Budget Throttle
        const nowMs = Date.now();
        const tenantKey = session.tenantId;
        const bucket = limitCache.get(tenantKey);

        if (!bucket || bucket.resetAt < nowMs) {
            limitCache.set(tenantKey, { count: 1, resetAt: nowMs + 60000 });
        } else {
            if (bucket.count >= 60) {
                return NextResponse.json({ error: "Too Many Requests. Discovery rate limit exceeded." }, { status: 429, headers: { 'Retry-After': '60' } });
            }
            bucket.count++;
        }

        const url = new URL(req.url);
        const requestId = url.searchParams.get('requestId') || randomUUID();

        const filters: DiscoveryFilters = {
            categoryId: url.searchParams.get('categoryId') || undefined,
            brandId: url.searchParams.get('brandId') || undefined,
            priceMin: url.searchParams.has('priceMin') ? Number(url.searchParams.get('priceMin')) : undefined,
            priceMax: url.searchParams.has('priceMax') ? Number(url.searchParams.get('priceMax')) : undefined,
            inStockOnly: url.searchParams.get('inStockOnly') === 'true',
            leadTimeMax: url.searchParams.has('leadTimeMax') ? Number(url.searchParams.get('leadTimeMax')) : undefined,
            sellerTierMin: (url.searchParams.get('sellerTierMin') as any) || undefined
        };

        const sortMode = (url.searchParams.get('sort') as SortMode) || 'RELEVANCE';
        const cursor = url.searchParams.get('cursor') || undefined;
        let limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 20;

        const startTime = Date.now();
        const weightsVersion = 'F3.1-v1';

        const params = {
            viewerTenantId: session.tenantId,
            filters,
            sortMode,
            cursor,
            limit,
            requestId,
            weightsVersion
        };

        // Execution
        const results = await rankNetworkListings(params);

        const computeLatencyMs = Date.now() - startTime;
        const dbLatencyMs = Math.floor(computeLatencyMs * 0.4); // Mocked approximation to split if not precisely traced

        // Optionally strip explainability for end users if ?debug=true isn't present
        const isDebug = url.searchParams.get('debug') === 'true';
        let safeResults: DiscoveryResultItem[] = [];

        if (!isDebug) {
            safeResults = results.results.map(r => {
                const { scoreBreakdown, ...safe } = r;
                return safe;
            });
        } else {
            safeResults = results.results;
        }

        // --- 2. Observability Logging (Fire & Forget)
        const queryHash = generateQueryHash(params);
        logDiscoveryRequest({
            viewerTenantId: session.tenantId,
            requestId,
            queryHash,
            weightsVersion,
            filtersJson: filters,
            sortMode,
            limit,
            latencyMs: computeLatencyMs,
            dbLatencyMs,
            computeLatencyMs: computeLatencyMs - dbLatencyMs,
            resultsCount: results.results.length,
            topResultsJson: results.results.slice(0, 5).map(r => ({
                listingId: r.listingId,
                score: r.scoreBreakdown?.finalScore || 0,
                isSponsored: r.isSponsored || false,
                topReasons: r.topReasons || []
            }))
        });

        return NextResponse.json({ ...results, results: safeResults });
    } catch (e: any) {
        console.error("Discovery API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
