import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ REDIS_URL is missing. Redis functionality will be limited.');
}

const isLocal = !process.env.REDIS_URL ||
    process.env.REDIS_URL.includes('localhost') ||
    process.env.REDIS_URL.includes('127.0.0.1');

// Upstash Redis connection with TLS support and recommended serverless settings
export const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    // CRITICAL: Vercel Serverless + Upstash requires TLS
    ...(isLocal ? {} : { tls: {} }),
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
    // Avoid spamming logs if it's a known connection issue during build
    if (process.env.NEXT_PHASE === 'phase-action-build') return;

    console.error(JSON.stringify({
        event: 'redis_error',
        timestamp: new Date().toISOString(),
        error: err.message,
        status: 'error',
    }));
});
