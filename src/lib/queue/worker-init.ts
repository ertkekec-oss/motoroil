import { marketplaceWorker } from "../../services/marketplaces/actions/worker";

let isInitialized = false;

export function initMarketplaceWorker() {
    if (isInitialized) return;

    console.log('🤖 Marketplace Action Worker initialized and listening...');

    marketplaceWorker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    marketplaceWorker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    isInitialized = true;
}
