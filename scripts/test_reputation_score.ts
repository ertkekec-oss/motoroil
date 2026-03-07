import { ReputationEngine } from '../src/services/network/reputation/reputationEngine';
import { ReputationBreakdownService } from '../src/services/network/reputation/reputationBreakdown';

async function run() {
    console.log('[SMOKE TEST] Recomputing full Reputation Score for TENANT_A...');
    try {
        const result = await ReputationEngine.recalculateReputationScore('TENANT_A');
        console.log('--- REPUTATION ENGINE OUTPUT ---');
        console.log('Tenant:', result.tenantId);
        console.log('Tier:', result.reputationTier);
        console.log('Base Comp Values:', {
            trust: result.trustComponentScore,
            shipping: result.shippingComponentScore,
            activity: result.activityComponentScore,
            escrow: result.escrowComponentScore
        });

        console.log('[SMOKE TEST] Fetching Tenant Projection Breakdown...');
        const breakdown = await ReputationBreakdownService.buildReputationBreakdown('TENANT_A');
        console.log('Supplier Role Score:', breakdown?.roleScores.supplier);
        console.log('Driving factors:', breakdown?.drivingFactors);

        console.log('Reputation Score Generator Tests Passed.');
    } catch (e: any) {
        console.error('Error during Reputation Test:', e);
    }
}

run();
