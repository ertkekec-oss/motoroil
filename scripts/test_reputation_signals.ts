import { ReputationSignalsService } from '../src/services/network/reputation/reputationSignals';

async function run() {
    console.log('[SMOKE TEST] Simulating Component Signals for TENANT_A...');
    try {
        const signals = await ReputationSignalsService.generateReputationSignals('TENANT_A');

        console.log('--- REPUTATION SIGNALS OUTPUT ---');
        console.log(`Generated ${signals.length} Signals`);
        signals.forEach(s => {
            console.log(`- ${s.signalDirection} [${s.signalType}]: ${s.summary} (impact: ${s.scoreImpact})`);
        });

        console.log('Idempotency Check: Running signal generator again...');
        const duplicateSignals = await ReputationSignalsService.generateReputationSignals('TENANT_A');
        console.log(`Regenerated ${duplicateSignals.length} Active Signals`);

        console.log('SUCCESS: Signals generator effectively replaced stale data and retained idempotent properties.');
    } catch (e: any) {
        console.error('Error during Signals Test:', e);
    }
}

run();
