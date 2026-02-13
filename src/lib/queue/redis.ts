import IORedis from 'ioredis';

if (!process.env.REDIS_URL) {
    throw new Error('❌ REDIS_URL environment variable is missing. Please configure Upstash Redis.');
}

// Upstash Redis connection with TLS support
export const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {}, // Standard TLS for Upstash rediss://
});

// Connection event logging (NO SECRETS)
redisConnection.on('connect', () => {
    console.log(JSON.stringify({
        event: 'redis_connected',
        timestamp: new Date().toISOString(),
        host: 'upstash',
        status: 'connected',
    }));
});

redisConnection.on('error', (err) => {
    console.error(JSON.stringify({
        event: 'redis_error',
        timestamp: new Date().toISOString(),
        error: err.message,
        status: 'error',
    }));
});
