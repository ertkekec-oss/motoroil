import { expireOldDemandSignals } from "@/domains/liquidity/services/demandSignal.service";

/**
 * Worker Job: expire-demand-signals
 * Queue: liquidity
 * Purpose: Finds signals whose expiry date has passed and moves them to EXPIRED state.
 */
export async function processExpireDemandSignalsJob() {
    try {
        console.log("Starting signal expiration scan...");
        const count = await expireOldDemandSignals();
        console.log(`Scan complete. Marked ${count} weak/old signals as EXPIRED.`);
    } catch (error) {
        console.error("Signal Expiry failed:", error);
        throw error;
    }
}
