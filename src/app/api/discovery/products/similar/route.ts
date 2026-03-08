import { NextResponse } from "next/server";
import { searchSimilarProducts } from "@/domains/product-discovery/services/productSearch.service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const canonicalProductId = searchParams.get("canonicalProductId");
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!canonicalProductId) {
            return NextResponse.json({ error: "canonicalProductId required" }, { status: 400 });
        }

        const similar = await searchSimilarProducts(canonicalProductId, limit);
        return NextResponse.json(similar);
    } catch (error) {
        console.error("Similar products error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
