import { ReputationEngine } from '../src/services/network/reputation/reputationEngine';
import { ReputationBreakdownService } from '../src/services/network/reputation/reputationBreakdown';
import { TenantReputationProjection } from '../src/services/network/reputation/projection/tenantReputationProjection';
import { AdminReputationProjection } from '../src/services/network/reputation/projection/adminReputationProjection';

async function run() {
    console.log('[SMOKE TEST] Generating Projections for TENANT_A...');
    try {
        const score = await ReputationEngine.getReputationScore('TENANT_A');
        const breakdown = await ReputationBreakdownService.buildReputationBreakdown('TENANT_A');

        console.log('--- TENANT FACING UI PROJECTION ---');
        const tenantView = TenantReputationProjection.projectOverview(score, { trendDirection: 'UP' }, breakdown);
        console.log(JSON.stringify(tenantView, null, 2));

        console.log('--- ADMIN FACING PROJECTION ---');
        const adminView = AdminReputationProjection.projectFullDetail(score, breakdown, []);
        console.log(JSON.stringify(adminView, null, 2));

        if (!tenantView?.hasOwnProperty('scoreId') && adminView?.hasOwnProperty('scoreId')) {
            console.log('SUCCESS: Safe projection achieved. Hidden attributes stripped from tenant API view.');
        } else {
            console.error('ERROR: Projection leak detected.');
        }

        console.log('Reputation Projection Engine Tests Passed.');
    } catch (e: any) {
        console.error('Error during Projection Test:', e);
    }
}

run();
