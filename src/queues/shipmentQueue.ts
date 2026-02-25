import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/queue/redis';

// Export the Queue
export const shipmentSyncQueue = new Queue('shipment-sync', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            count: 200, // keep latest 200 items in Redis
            age: 86400, // 24 hours
        },
        removeOnFail: {
            count: 500, // Keep failed history for debugging
        },
    },
});
