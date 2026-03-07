import { ShippingReliabilityService } from '../src/services/shipping/intelligence/shippingReliability';

async function run() {
    console.log('[SMOKE TEST] Calculating Shipping Reliability for TENANT_A...');
    try {
        const score = await ShippingReliabilityService.recalculateShippingReliabilityScore('TENANT_A');
        console.log('Result:', score);

        console.log('[SMOKE TEST] Duplicate recalculation (Idempotency Check)...');
        const duplicate = await ShippingReliabilityService.recalculateShippingReliabilityScore('TENANT_A');

        if (score.id === duplicate.id) {
            console.log('SUCCESS: Idempotency honored. Returned the same instance.');
        } else {
            console.error('ERROR: Duplicate calculation created new record.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    }
}

run();
