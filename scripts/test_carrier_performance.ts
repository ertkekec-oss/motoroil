import { CarrierPerformanceService } from '../src/services/shipping/intelligence/carrierPerformance';

async function run() {
    console.log('[SMOKE TEST] Calculating Carrier Performance for HEPSIJET...');
    try {
        const perf = await CarrierPerformanceService.recalculateCarrierPerformance('HEPSIJET', 'GLOBAL');
        console.log('Result:', perf);

        console.log('[SMOKE TEST] Re-running to verify idempotency...');
        const duplicate = await CarrierPerformanceService.recalculateCarrierPerformance('HEPSIJET', 'GLOBAL');

        if (perf.id === duplicate.id) {
            console.log('SUCCESS: Snapshot creation was idempotent.');
        } else {
            console.error('ERROR: Idempotency failed. Created duplicate snapshot.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    }
}

run();
