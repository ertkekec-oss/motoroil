import { NextResponse } from "next/server";
import { processIndexCanonicalProductsJob } from "@/jobs/product-discovery/indexCanonicalProducts";
import { processIndexSupplierProductsJob } from "@/jobs/product-discovery/indexSupplierProducts";

export async function POST(req: Request) {
    try {
        // In production we would queue this. Here we execute it sync or fire and forget.
        console.log("Admin initiated Full Reindex");

        // Async execution to not block response
        Promise.all([
            processIndexCanonicalProductsJob(),
            processIndexSupplierProductsJob()
        ]).then(() => console.log("Reindex operations complete."))
            .catch(e => console.error("Reindex operations failed:", e));

        return NextResponse.json({ success: true, message: "Reindexing jobs started successfully" });
    } catch (error) {
        console.error("Reindex trigger error:", error);
        return NextResponse.json({ error: "Failed to start reindex" }, { status: 500 });
    }
}
