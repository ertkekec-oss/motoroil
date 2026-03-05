import { Queue, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Shared rediscover configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// During next.js static generation/builds, we shouldn't attempt to connect to Redis
// Vercel build typically runs without REDIS_URL, so we can use that as an easy fallback.
const disableRedis = !process.env.REDIS_URL;

export const redisConnection = disableRedis ? null as any : new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

function createQueue(name: string) {
    if (disableRedis) {
        // Return dummy proxy for Next.js build step
        return new Proxy({}, { get: () => () => Promise.resolve() }) as any;
    }
    return new Queue(name, { connection: redisConnection });
}

// Define Queues
export const renderPdfQueue = createQueue('contracts_render_pdf');
export const webhookIngestQueue = createQueue('contracts_webhook_ingest');
export const sendSmsOtpQueue = createQueue('contracts_send_sms_otp');
export const exportAuditQueue = createQueue('contracts_export_audit');
export const sendEnvelopeQueue = createQueue('contracts_send_envelope');
export const finalizeSignatureQueue = createQueue('contracts_finalize_signature');
export const verifySignatureQueue = createQueue('contracts_verify_signature');
