import { NextResponse } from "next/server";
import { searchSupplierProducts } from "@/domains/product-discovery/services/productSearch.service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const tenantId = searchParams.get("tenantId");
        const brand = searchParams.get("brand");
        const limit = parseInt(searchParams.get("limit") || "20");

        const filter: any = {};
        if (tenantId) filter.tenantId = tenantId;
        if (brand) filter.brand = brand;

        const suppliers = await searchSupplierProducts(q, filter, limit);

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Supplier search error:", error);
        return NextResponse.json({ error: "Supplier search failed" }, { status: 500 });
    }
}
