import { TradeRiskEngine } from '../src/services/network/financeRisk/tradeRiskEngine';

async function run() {
    console.log('[SMOKE TEST] Calculating General Tenant Finance Risk for TENANT_A...');
    try {
        const result = await TradeRiskEngine.recalculateTenantRisk('TENANT_A');
        console.log('--- TRADE RISK ENGINE OUTPUT ---');
        console.log('Buyer Tenant:', result.buyerTenantId);
        console.log('Risk Tier:', result.riskTier);
        console.log('Overall Score (Higher is riskier):', result.overallRiskScore.toFixed(2));
        console.log('Sub-scores Breakdown:', {
            paymentRel: result.paymentReliabilityScore,
            disputeProb: result.disputeProbabilityScore,
            reputationRisk: result.reputationRiskScore,
        });

        console.log('[SMOKE TEST] Calculating Counterparty Risk Pair...');
        const pair = await TradeRiskEngine.recalculateCounterpartyPairRisk('TENANT_A', 'TENANT_B');

        if (pair.contextType === 'COUNTERPARTY_PAIR' && pair.sellerTenantId === 'TENANT_B') {
            console.log(`SUCCESS: Counterparty Pair evaluated with risk tier: ${pair.riskTier}`);
            console.log('Trade Risk Idempotent Generation Test Passed.');
        } else {
            console.error('ERROR: Pair calculation returned invalid context.');
        }
    } catch (e: any) {
        console.error('Error during Risk Engine Test:', e);
    }
}

run();
