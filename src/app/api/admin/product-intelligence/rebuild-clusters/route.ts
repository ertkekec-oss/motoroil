import { NextResponse } from "next/server";
import { processRebuildProductClustersJob } from "@/jobs/product-intelligence/rebuildProductClusters";

export async function POST() {
    try {
        // In a real production system this would push to BullMQ or similar.
        // For now we run it immediately for the admin action.
        await processRebuildProductClustersJob();
        return NextResponse.json({ success: true, message: "Cluster rebuild initiated successfully." });
    } catch (error) {
        console.error("Error rebuilding clusters:", error);
        return NextResponse.json({ error: "Failed to rebuild clusters" }, { status: 500 });
    }
}
