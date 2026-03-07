import { JobDispatcher } from '../../src/services/jobs/jobDispatcher';
import { JobRegistry } from '../../src/services/jobs/jobRegistry';
import { JobExecutor } from '../../src/services/jobs/jobExecutor';

JobRegistry.registerJobType({
    jobType: 'TEST_FAIL_JOB',
    moduleScope: 'TEST',
    defaultQueue: 'TEST_QUEUE',
    defaultPriority: 'NORMAL',
    maxRetries: 2,
    backoff: 'FIXED',
    supportsScheduling: false,
    idempotencyRequired: false,
    handler: async () => { throw new Error('Forced Fatal Error for Test'); }
});

async function run() {
    console.log('[SMOKE TEST] Testing Retry limits and Dead Letter quarantine...');
    try {
        const job = await JobDispatcher.dispatchJob({ jobType: 'TEST_FAIL_JOB', payload: {} });

        let result = await JobExecutor.executeJob(job.id, 'worker-1');
        console.log(`Execution 1 Result: ${result.status}`); // FAILED_OR_RETRY

        // Attempt 2
        result = await JobExecutor.executeJob(job.id, 'worker-1');
        console.log(`Execution 2 Result: ${result.status}`); // FAILED_OR_RETRY

        // Attempt 3 (Should fail completely and hit DLQ)
        result = await JobExecutor.executeJob(job.id, 'worker-1');
        console.log(`Execution 3 Result: ${result.status}`); // FAILED_OR_RETRY -> Dead Letter

        const checkPrisma = require('@prisma/client').PrismaClient;
        const prisma = new checkPrisma();

        const deadJob = await prisma.systemJob.findUnique({ where: { id: job.id } });
        if (deadJob.status === 'DEAD_LETTER') {
            console.log(`SUCCESS: Job hit max retries and stopped at DEAD_LETTER status.`);
        } else {
            console.error(`ERROR: Job status is ${deadJob.status}. Expected DEAD_LETTER.`);
        }

        const dlLog = await prisma.systemDeadLetterJob.findFirst({ where: { originalJobId: job.id } });
        if (dlLog) {
            console.log(`SUCCESS: Moved accurately to SystemDeadLetterJob registry with Trace: ${dlLog.errorMessage}`);
        } else {
            console.error('ERROR: DLQ trace missing.');
        }

        console.log('Retry Backoff + Dead Letter Test Done.');

    } catch (e: any) {
        console.error('Dead Letter Test Failed:', e);
    }
}

run();
