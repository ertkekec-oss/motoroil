import { Queue } from 'bullmq';
import { redisConnection } from './redis';

// ============================================================================
// MARKETPLACE ACTIONS QUEUE & DLQ
// ============================================================================

export const marketplaceQueue = new Queue('marketplace-actions', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            count: 100, // Keep last 100 successful jobs
            age: 3600, // Remove after 1 hour
        },
        removeOnFail: {
            count: 500, // Keep last 500 failed jobs for debugging
        },
    },
});

export const marketplaceDlq = new Queue('marketplace-actions-dlq', {
    connection: redisConnection as any,
    defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
    },
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function isRedisHealthy(): Promise<boolean> {
    try {
        await redisConnection.ping();
        return true;
    } catch (error) {
        console.error(JSON.stringify({
            event: 'redis_health_check_failed',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return false;
    }
}
