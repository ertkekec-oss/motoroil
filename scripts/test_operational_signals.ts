import { OperationalSignalService } from '../src/services/shipping/intelligence/operationalSignals';

async function run() {
    console.log('[SMOKE TEST] Generating Operational Signals for TENANT_A and SYSTEM...');
    try {
        await OperationalSignalService.generateOperationalSignals('TENANT', 'TENANT_A');
        await OperationalSignalService.generateOperationalSignals('SYSTEM');

        console.log('SUCCESS: Operational Signals generated without error.');
    } catch (e) {
        console.error('Error during test:', e);
    }
}

run();
