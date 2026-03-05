import { Queue, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Shared rediscover configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// Define Queues
export const renderPdfQueue = new Queue('contracts:render_pdf', { connection: redisConnection as any });
export const webhookIngestQueue = new Queue('contracts:webhook_ingest', { connection: redisConnection as any });
export const sendSmsOtpQueue = new Queue('contracts:send_sms_otp', { connection: redisConnection as any });
export const exportAuditQueue = new Queue('contracts:export_audit', { connection: redisConnection as any });
export const sendEnvelopeQueue = new Queue('contracts:send_envelope', { connection: redisConnection as any });
export const finalizeSignatureQueue = new Queue('contracts:finalize_signature', { connection: redisConnection as any });
export const verifySignatureQueue = new Queue('contracts:verify_signature', { connection: redisConnection as any });
