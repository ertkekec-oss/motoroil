import { ingestTrackingEvent } from '../core/trackingIngestion';
import { resolveCarrierAdapter } from '../carriers/carrierRegistry';
import prisma from '@/lib/prisma';

export async function processShipmentRefreshJob(jobPayload: { shipmentId: string, carrierCode: string, trackingNumber: string }) {
    const { shipmentId, carrierCode, trackingNumber } = jobPayload;
    const adapter = resolveCarrierAdapter(carrierCode);

    try {
        const events = await adapter.getShipmentTracking(trackingNumber);
        for (const event of events) {
            await ingestTrackingEvent({
                shipmentId,
                carrierCode,
                externalEventId: event.carrierEventCode || null,
                carrierEventCode: event.carrierEventCode || null,
                normalizedStatus: event.normalizedStatus,
                locationText: event.locationText,
                description: event.description,
                rawPayload: event.rawPayload,
                eventTime: event.eventTime
            });
        }
        await prisma.networkShipment.update({ where: { id: shipmentId }, data: { updatedAt: new Date() } });
        return { success: true, trackingUpdated: events.length > 0 };
    } catch (error: any) {
        console.error(`[ProcessShipmentRefreshJob] Error syncing shipment ${shipmentId}:`, error);
        throw error;
    }
}
