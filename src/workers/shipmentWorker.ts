import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue/redis';
import { processShipmentEvent } from '@/services/shipment/processEvent';
import { ManualCarrier } from '@/services/shipment/carriers/manual';
import { MockCarrier } from '@/services/shipment/carriers/mock';
import { CarrierAdapter } from '@/services/shipment/carriers/adapter';

function getAdapter(carrierCode: string): CarrierAdapter | null {
    if (carrierCode === 'MOCK') return new MockCarrier();
    if (carrierCode === 'MANUAL') return new ManualCarrier();
    return null;
}

export const shipmentWorker = new Worker('shipment-sync', async (job: Job) => {
    const { trackingNumber, carrierCode } = job.data as { trackingNumber: string; carrierCode: string; shipmentId: string };

    if (!trackingNumber || !carrierCode) {
        throw new Error(`Job ${job.id}: Missing trackingNumber or carrierCode`);
    }

    const adapter = getAdapter(carrierCode);
    if (!adapter) {
        return; // Skip unsupported automated tracking for unmapped providers
    }

    const events = await adapter.track(trackingNumber);
    if (!events || events.length === 0) return;

    for (const event of events) {
        // Construct canonical event ID if provider didn't pass one through
        let safeEventId = event.rawPayload?.eventId;
        if (!safeEventId) {
            const hash = Buffer.from(`${trackingNumber}_${event.status}_${event.occurredAt.getTime()}`).toString('base64');
            safeEventId = `sync_${hash}`;
        }

        const success = await processShipmentEvent({
            carrierCode,
            carrierEventId: safeEventId,
            trackingNumber,
            status: event.status,
            description: event.description,
            rawPayload: event.rawPayload || {}
        });

        if (!success) {
            // Let BullMQ catch this and apply exponential retry logic instead of silently ignoring it!
            throw new Error(`Integration failed saving shipment state: tracking ${trackingNumber} on phase ${event.status}`);
        }
    }
}, {
    connection: redisConnection as any,
    concurrency: 5 // Limit active carrier polling API calls concurrently
});

shipmentWorker.on('completed', (job) => {
    console.log(`[Worker] Shipment Sync success for Job ${job.id}`);
});

shipmentWorker.on('failed', (job, err) => {
    console.error(`[Worker] Shipment Sync failed for Job ${job?.id}: ${err.message}`);
});
