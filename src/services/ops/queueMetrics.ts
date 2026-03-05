import {
    createIntentQueue,
    capturePaymentQueue,
    refundPaymentQueue,
    releaseEscrowQueue,
    refundEscrowQueue,
    processPaymentWebhookQueue,
    executePayoutQueue,
    bankFeedInboxQueue
} from '../payments/queue';
import { disableRedis } from '@/lib/queue/redis';

const queues = {
    createIntentQueue,
    capturePaymentQueue,
    refundPaymentQueue,
    releaseEscrowQueue,
    refundEscrowQueue,
    processPaymentWebhookQueue,
    executePayoutQueue,
    bankFeedInboxQueue
};

export async function getQueueMetrics() {
    if (disableRedis) return []; // build safe

    const metrics = [];
    for (const [name, queue] of Object.entries(queues)) {
        if (!queue || !queue.getJobCounts) continue; // skip mock
        const counts = await queue.getJobCounts();

        let oldestJobAge = null;
        let waitingCount = 0;
        try {
            const waiting = await queue.getWaiting();
            waitingCount = waiting.length;
            if (waitingCount > 0) {
                oldestJobAge = Date.now() - waiting[0].timestamp;
            }
        } catch (e) {
            // Redis error gracefully skipped
        }

        let isPaused = false;
        try {
            isPaused = await queue.isPaused();
        } catch (e) { }

        metrics.push({
            name,
            counts,
            oldestJobAgeMs: oldestJobAge,
            isPaused
        });
    }
    return metrics;
}

export async function performQueueAction(queueName: string, action: 'pause' | 'resume' | 'drain') {
    if (disableRedis) return;
    const queue = (queues as any)[queueName];
    if (!queue || !queue.pause) return;

    if (action === 'pause') await queue.pause();
    if (action === 'resume') await queue.resume();
    if (action === 'drain') await queue.drain();
}
