import { CapacityEstimator } from '../src/services/network/capacity/capacityEstimator';

async function main() {
    console.log('🔄 Starting Supplier Capacity Estimator Test...');

    try {
        const count = await CapacityEstimator.refreshAllSupplierCapacities();
        console.log(`✅ Supplier capacity estimations refreshed. Count: ${count}`);
    } catch (e: any) {
        console.error('❌ Supplier capacity estimation failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
