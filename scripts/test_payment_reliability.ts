import { PaymentReliabilityService } from '../src/services/network/financeRisk/paymentReliability';

async function run() {
    console.log('[SMOKE TEST] Calculating Payment Reliability for TENANT_A...');
    try {
        const snap = await PaymentReliabilityService.recalculatePaymentReliabilitySnapshot('TENANT_A');

        console.log('--- PAYMENT RELIABILITY SNAPSHOT ---');
        console.log(`TenantId: ${snap.tenantId}`);
        console.log(`Score: ${snap.paymentReliabilityScore}`);
        console.log(`Success Count: ${snap.successfulEscrowCount}`);
        console.log(`Refund Count: ${snap.refundedEscrowCount}`);
        console.log(`Dispute Count: ${snap.disputedEscrowCount}`);
        console.log(`Avg Rel Delay: ${snap.avgReleaseDelayHours} Hrs`);

        if (snap.status === 'ACTIVE') {
            console.log('SUCCESS: Reliable escrow history translated to snapshot summary.');
        } else {
            console.error('ERROR: Snapshot failed to create.');
        }
    } catch (e: any) {
        console.error('Error during Reliability Test:', e);
    }
}

run();
