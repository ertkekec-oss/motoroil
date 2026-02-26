import { NextRequest, NextResponse } from "next/server";
import { rankNetworkListings } from "@/services/network/discovery/ranking";
import { getSession } from "@/lib/auth"; // Adjust to standard method
import { DiscoveryFilters, SortMode } from "@/services/network/discovery/types";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);

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
        const limitStr = url.searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 20;

        const results = await rankNetworkListings({
            viewerTenantId: session.tenantId,
            filters,
            sortMode,
            cursor,
            limit
        });

        // Optionally strip explainability for end users if ?debug=true isn't present
        const isDebug = url.searchParams.get('debug') === 'true';
        if (!isDebug) {
            results.results = results.results.map(r => {
                const { scoreBreakdown, ...safe } = r;
                return safe;
            });
        }

        return NextResponse.json(results);
    } catch (e: any) {
        console.error("Discovery API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
