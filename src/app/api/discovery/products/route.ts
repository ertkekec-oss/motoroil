import { NextResponse } from "next/server";
import { searchProducts, searchProductsByCategory } from "@/domains/product-discovery/services/productSearch.service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");
        const category = searchParams.get("category");
        const limit = parseInt(searchParams.get("limit") || "20");

        let results = [];
        if (category && !q) {
            results = await searchProductsByCategory(category, limit);
        } else if (q) {
            results = await searchProducts(q, limit);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Discovery error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
