import { EscrowPolicyEngine } from '../src/services/network/financeRisk/escrowPolicyEngine';

async function run() {
    console.log('[SMOKE TEST] Simulating dynamic Escrow Policy translation based on Trade Risk Engine...');
    try {
        const decision = await EscrowPolicyEngine.buildEscrowPolicyDecision('ESC_HOLD_999X', { buyerTenantId: 'TENANT_A', sellerTenantId: 'TENANT_B' });

        console.log('--- ESCROW POLICY DECISION ---');
        console.log(`Hold ID: ${decision.escrowHoldId}`);
        console.log(`Decision Type: ${decision.decisionType}`);
        console.log(`Lock Duration: ${decision.holdDays} days`);
        console.log(`Dispute Window: ${decision.disputeWindowHours} hrs`);
        console.log(`Admin Review Forced: ${decision.manualReviewRequired}`);
        console.log(`Policy Detail Notes: ${decision.notes}`);

        if (decision.decisionType) {
            console.log('SUCCESS: Finance Risk generated an executable policy structure for Escrow Engine integration.');
        } else {
            console.error('ERROR: Enum decision empty.');
        }
    } catch (e: any) {
        console.error('Error during Policy Test:', e);
    }
}

run();
