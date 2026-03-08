import prisma from "@/lib/prisma";
import { processDetectDemandSignalJob } from "./detectDemandSignal";

/**
 * Worker Job: rebuild-demand-forecasts
 * Queue: liquidity
 * Purpose: Iterates over network network/tenant products and rebuilds their forecasts. 
 */
export async function processRebuildDemandForecastsJob() {
    try {
        console.log("Starting batch calculation of Demand Forecasts...");

        // Find all mapped products in the network
        const mappings = await prisma.tenantProductMapping.findMany({
            select: { tenantId: true, productId: true },
            take: 1000 // In prod, paginate this via queue or cursor
        });

        console.log(`Found ${mappings.length} network product nodes to forecast.`);

        let cnt = 0;
        for (const node of mappings) {
            try {
                // Generating a forecast basically evaluates the signal logic and commits it.
                await processDetectDemandSignalJob({ tenantId: node.tenantId, productId: node.productId });
                cnt++;
            } catch (err) { }
        }

        console.log(`Forecast Batch Complete. Generated outputs for ${cnt} nodes.`);
    } catch (error) {
        console.error("Failed batch forecast job", error);
        throw error;
    }
}
