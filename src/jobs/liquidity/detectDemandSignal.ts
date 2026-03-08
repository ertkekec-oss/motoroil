import { detectDemandSignalForProduct } from "@/domains/liquidity/services/demandSignal.service";

/**
 * Worker Job: detect-demand-signal
 * Queue: liquidity
 * Purpose: Analyzes velocity and stock for a product to detect potential demand spikes or stockouts.
 */
export async function processDetectDemandSignalJob(data: { tenantId: string; productId: string }) {
    try {
        console.log(`Analyzing demand for tenant: ${data.tenantId}, product: ${data.productId}`);
        const result = await detectDemandSignalForProduct(data.tenantId, data.productId);

        if (result) {
            console.log(`[!] Detected Demand: ${result.signalType} (Strength: ${result.signalStrength})`);
        } else {
            console.log(`[i] No critical demand signal triggered for ${data.productId}.`);
        }

        return result;
    } catch (error) {
        console.error(`Failed demand analysis for ${data.productId}`, error);
        throw error;
    }
}
