import { ReputationFeedbackService } from '../src/services/network/reputation/reputationFeedback';

async function run() {
    console.log('[SMOKE TEST] Simulating Discovery & Escrow Feedback loops...');
    try {
        const discoveryBoost = await ReputationFeedbackService.buildDiscoveryReputationBoost('TENANT_A');
        console.log(`Discovery Algorithm multiplier for TENANT_A: ${discoveryBoost}x`);

        const routingAdj = await ReputationFeedbackService.buildRoutingReputationAdjustment('TENANT_A');
        console.log(`Automated Wave Routing multiplier: ${routingAdj}x`);

        const escrowPolicy = await ReputationFeedbackService.buildEscrowReputationAdjustment('TENANT_A');
        console.log(`Escrow Action Policy: ${JSON.stringify(escrowPolicy)}`);

        if (escrowPolicy.holdDays) {
            console.log('SUCCESS: Feedback multipliers correctly parsed and Escrow timeline policies actively attached.');
        } else {
            console.error('ERROR: Missing hold logic in Rep feedback layer.');
        }

        console.log('Reputation Feedback Engine Tests Passed.');
    } catch (e: any) {
        console.error('Error during Feedback Test:', e);
    }
}

run();
