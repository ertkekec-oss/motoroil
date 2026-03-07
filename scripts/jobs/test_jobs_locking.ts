import { JobDispatcher } from '../../src/services/jobs/jobDispatcher';
import { JobLocking } from '../../src/services/jobs/jobLocking';
import { JobRegistry } from '../../src/services/jobs/jobRegistry';

JobRegistry.registerJobType({
    jobType: 'TEST_LONG_RUNNING_JOB',
    moduleScope: 'TEST',
    defaultQueue: 'TEST_QUEUE',
    defaultPriority: 'NORMAL',
    maxRetries: 0,
    backoff: 'FIXED',
    supportsScheduling: false,
    idempotencyRequired: false,
    handler: async () => { return { success: true }; }
});

async function run() {
    console.log('[SMOKE TEST] Testing Distributed Job Worker Locking ...');
    try {
        const job = await JobDispatcher.dispatchJob({ jobType: 'TEST_LONG_RUNNING_JOB', payload: {} });

        const locked1 = await JobLocking.tryAcquireJobLock(job.id, 'worker-A', 5000); // 5 sec lock
        console.log(`Worker A Lock Acquired: ${locked1}`);

        // Try double steal
        const locked2 = await JobLocking.tryAcquireJobLock(job.id, 'worker-B', 15000);
        console.log(`Worker B Try Lock Acquired: ${locked2}`); // should be false

        if (locked1 && !locked2) {
            console.log(`SUCCESS: Job is locked exclusively by Worker-A.`);
        } else {
            console.error(`ERROR: Lock was compromised.`);
        }

        // Renew the lock
        const renew = await JobLocking.renewJobLock(job.id, 'worker-A', 10000);
        console.log(`Worker A Lock Renewed: ${renew}`);

        // Wait to expire artificially in database (simulated)
        const checkPrisma = require('@prisma/client').PrismaClient;
        const prisma = new checkPrisma();

        await prisma.systemJob.update({
            where: { id: job.id },
            data: { lockExpiresAt: new Date(Date.now() - 60000) } // Push past 1 minute
        });

        // Trigger garbage collector logic
        const recovered = await JobLocking.recoverExpiredLocks();
        console.log(`Locks Recovered from ZOMBIES: ${recovered.count}`);

        if (recovered.count > 0) {
            console.log(`SUCCESS: De-orphaned stalled locks seamlessly.`);
        } else {
            console.error(`ERROR: Stalled lock was not garbage collected.`);
        }

    } catch (e: any) {
        console.error('Locking Test Failed:', e);
    }
}

run();
