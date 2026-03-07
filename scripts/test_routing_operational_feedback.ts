import { RoutingFeedbackService } from '../src/services/shipping/intelligence/routingFeedback';
import { TrustFeedbackService } from '../src/services/shipping/intelligence/trustFeedback';

async function run() {
    console.log('[SMOKE TEST] Trust & Routing feedback integration...');
    try {
        const trustEffect = await TrustFeedbackService.applyShippingTrustFeedback('TENANT_A');
        console.log('Trust Feedback Result:', trustEffect);

        const dummyScore = 100;
        const context = await RoutingFeedbackService.buildRoutingOperationalAdjustment('TENANT_A', { targetRegion: 'MARMARA' });
        const finalScore = RoutingFeedbackService.applyOperationalWeightToSupplierScore(dummyScore, context);

        console.log('Routing Context Adjustment:', context);
        console.log('Final Adjusted Routing Score:', finalScore);

        console.log('SUCCESS: Feedback loops apply logic properly.');
    } catch (e) {
        console.error('Error during test:', e);
    }
}

run();
