import { NextResponse } from "next/server";
import { autocompleteProducts } from "@/domains/product-discovery/services/productSearch.service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const limit = parseInt(searchParams.get("limit") || "5");

        if (!q) {
            return NextResponse.json([]);
        }

        const suggestions = await autocompleteProducts(q, limit);
        return NextResponse.json(suggestions);
    } catch (error) {
        console.error("Autocomplete error:", error);
        return NextResponse.json({ error: "Autocomplete search failed" }, { status: 500 });
    }
}
