import { ingestTrackingEvent } from '../core/trackingIngestion';
import { resolveCarrierAdapter } from '../carriers/carrierRegistry';
import prisma from '@/lib/prisma';

export async function webhookHandler(carrierCode: string, payload: any) {
    const adapter = resolveCarrierAdapter(carrierCode);

    // In real implementation, parsing the barcode from payload
    // HepsiJet might send { trackingNumber: "...", status: "...", date: "..." }
    const trackingNumber = payload.trackingNumber || payload.barcode;
    if (!trackingNumber) {
        throw new Error('Mising tracking identity in webhook payload');
    }

    const shipment = await prisma.networkShipment.findFirst({
        where: { carrierCode, trackingNumber },
        orderBy: { createdAt: 'desc' }
    });

    if (!shipment) {
        console.warn(`[WebhookHandler] Ignored event for unknown shipment: ${trackingNumber}`);
        return null;
    }

    const normalizedStatus = adapter.normalizeTrackingEvent(payload);

    return ingestTrackingEvent({
        shipmentId: shipment.id,
        carrierCode,
        externalEventId: payload.eventId || null,
        carrierEventCode: payload.statusCode || null,
        normalizedStatus,
        locationText: payload.location || null,
        description: payload.description || 'Webhook update',
        rawPayload: payload,
        eventTime: payload.timestamp ? new Date(payload.timestamp) : new Date()
    });
}
