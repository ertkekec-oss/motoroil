import IORedis from 'ioredis';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';


if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ REDIS_URL is missing. Redis functionality will be limited.');
}

// Upstash Redis connection with TLS support
export const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...(process.env.REDIS_URL?.startsWith('rediss://') ? { tls: {} } : {}),
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
