import { Queue } from 'bullmq';
import { redisConnection, disableRedis } from '@/lib/queue/redis';

function createQueue(name: string) {
    if (disableRedis) {
        // Return dummy proxy for Next.js build step
        return new Proxy({}, { get: () => () => Promise.resolve() }) as any;
    }
    return new Queue(name, { connection: redisConnection as any });
}

// Payment Queues
export const createIntentQueue = createQueue('payments_create_intent');
export const capturePaymentQueue = createQueue('payments_capture');
export const refundPaymentQueue = createQueue('payments_refund');

// Escrow Queues
export const releaseEscrowQueue = createQueue('escrow_release');
export const refundEscrowQueue = createQueue('escrow_refund');

// Webhook / Integration Inbox Queue
export const processPaymentWebhookQueue = createQueue('inbox_process_payment_webhook');

// Payout Queues
export const executePayoutQueue = createQueue('payouts_execute');
export const bankFeedInboxQueue = createQueue('inbox_bank_feed_matcher');
