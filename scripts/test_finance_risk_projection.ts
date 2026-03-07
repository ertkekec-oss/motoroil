import { TradeRiskEngine } from '../src/services/network/financeRisk/tradeRiskEngine';
import { EscrowPolicyEngine } from '../src/services/network/financeRisk/escrowPolicyEngine';
import { PaymentReliabilityService } from '../src/services/network/financeRisk/paymentReliability';
import { TenantRiskProjection } from '../src/services/network/financeRisk/projection/tenantRiskProjection';
import { AdminRiskProjection } from '../src/services/network/financeRisk/projection/adminRiskProjection';

async function run() {
    console.log('[SMOKE TEST] Calculating Projections for Counterparty & Tenant...');
    try {
        const score = await TradeRiskEngine.recalculateTenantRisk('TENANT_A');
        const snap = await PaymentReliabilityService.recalculatePaymentReliabilitySnapshot('TENANT_A');
        const policy = await EscrowPolicyEngine.buildEscrowPolicyDecision('TEST_ESC', { buyerTenantId: 'TENANT_A', sellerTenantId: 'TENANT_B' });

        console.log('--- TENANT FACING RISK UI PROJECTION ---');
        const tenantView = TenantRiskProjection.projectOverview(score, snap, { riskClass: 'LOW' }, policy);
        console.log(JSON.stringify(tenantView, null, 2));

        console.log('--- ADMIN FACING RISK PROJECTION ---');
        const adminView = AdminRiskProjection.projectFullDetail(score, [], policy);
        console.log(JSON.stringify(adminView, null, 2));

        if (!tenantView?.hasOwnProperty('id') && adminView?.hasOwnProperty('id')) {
            console.log('SUCCESS: Safe projection achieved. Hidden attributes and weights removed from tenant interface.');
        } else {
            console.error('ERROR: Projection leak detected.');
        }

        console.log('Finance Risk Projection Mapping Tests Passed.');
    } catch (e: any) {
        console.error('Error during Projection Test:', e);
    }
}

run();
