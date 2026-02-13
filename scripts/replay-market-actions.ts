import { marketplaceDlq, marketplaceQueue } from '../src/lib/queue';
import { redisConnection } from '../src/lib/queue/redis';

/**
 * Replay failed marketplace actions from DLQ
 */
async function replayFromDlq(options: {
    idempotencyKey?: string,
    all?: boolean,
    limit?: number
}) {
    console.log('🔍 Starting DLQ Replay Processor...');

    const jobs = await marketplaceDlq.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);

    let replayCount = 0;
    const filterKey = options.idempotencyKey;

    for (const job of jobs) {
        const data = job.data;
        const idempKey = data.input?.idempotencyKey;

        if (filterKey && idempKey !== filterKey) continue;

        console.log(`🚀 Replaying job: ${idempKey} (Original Action: ${data.input?.actionKey})`);

        // Add back to main queue with new attempt
        await marketplaceQueue.add(job.name.replace('dead:', ''), data.input, {
            jobId: idempKey, // Use original idempotency key to prevent double work if main queue has it
        });

        // Remove from DLQ after successful re-enqueue
        await job.remove();

        replayCount++;
        if (options.limit && replayCount >= options.limit) break;
    }

    console.log(`✅ Replayed ${replayCount} jobs.`);
}

// Simple CLI runner
const args = process.argv.slice(2);
const idempKey = args.find(a => a.startsWith('--id='))?.split('=')[1];
const all = args.includes('--all');

if (!idempKey && !all) {
    console.log('Usage: tsx scripts/replay-market-actions.ts --id=KEY or --all');
    process.exit(0);
}

replayFromDlq({ idempotencyKey: idempKey, all })
    .then(() => {
        console.log('Done.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal error during replay:', err);
        process.exit(1);
    });
