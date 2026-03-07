import { JobDispatcher } from '../../src/services/jobs/jobDispatcher';

async function run() {
    console.log('[SMOKE TEST] Testing unique idempotent dispatch...');
    try {
        const job1 = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_MARKET_SIGNALS',
            payload: { context: 'tenant-a' },
            idempotencyKey: 'IDEMP_KEY_TEST_1'
        });

        const job2 = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_MARKET_SIGNALS',
            payload: { context: 'tenant-a' },
            idempotencyKey: 'IDEMP_KEY_TEST_1'
        });

        if (job1.id === job2.id) {
            console.log(`SUCCESS: Duplicate dispatch properly blocked. Both returned Job ${job1.id}`);
        } else {
            console.error(`ERROR: Idempotency breached. Created distinct jobs ${job1.id} and ${job2.id}`);
        }

    } catch (e: any) {
        console.error('Dispatch Test Failed:', e);
    }
}

run();
