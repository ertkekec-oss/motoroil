import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// ============================================================================
// PRODUCTION-READY REDIS CONNECTION (Upstash Compatible)
// ============================================================================

if (!process.env.REDIS_URL) {
    throw new Error('❌ REDIS_URL environment variable is missing. Please configure Upstash Redis.');
}

// Upstash Redis connection with TLS support
export const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
        rejectUnauthorized: false, // Required for Upstash
    },
});

// Connection event logging
redisConnection.on('connect', () => {
    console.log(JSON.stringify({
        event: 'redis_connected',
        timestamp: new Date().toISOString(),
        url: process.env.REDIS_URL?.split('@')[1] || 'unknown', // Log host only (security)
    }));
});

redisConnection.on('error', (err) => {
    console.error(JSON.stringify({
        event: 'redis_error',
        timestamp: new Date().toISOString(),
        error: err.message,
    }));
});

// ============================================================================
// MARKETPLACE ACTIONS QUEUE
// ============================================================================

export const marketplaceQueue = new Queue('marketplace-actions', {
    connection: process.env.REDIS_URL, // BullMQ will parse the URL automatically
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
