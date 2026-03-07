import prisma from '@/lib/prisma';
import { resolveCarrierAdapter } from '../carriers/carrierRegistry';
import { ingestTrackingEvent } from './trackingIngestion';

export async function refreshTracking(shipmentId: string) {
    const shipment = await prisma.networkShipment.findUnique({
        where: { id: shipmentId },
        include: { trackingEvents: true }
    });

    if (!shipment) throw new Error('Shipment not found');
    if (!shipment.trackingNumber) throw new Error('No tracking number assigned');

    const adapter = resolveCarrierAdapter(shipment.carrierCode);
    const trackingEvents = await adapter.getShipmentTracking(shipment.trackingNumber);

    for (const event of trackingEvents) {
        await ingestTrackingEvent({
            shipmentId: shipment.id,
            carrierCode: shipment.carrierCode,
            externalEventId: event.carrierEventCode || null,
            carrierEventCode: event.carrierEventCode || null,
            normalizedStatus: event.normalizedStatus,
            locationText: event.locationText,
            description: event.description,
            rawPayload: event.rawPayload,
            eventTime: event.eventTime
        });
    }

    return true;
}

export async function refreshTrackingByCarrier(carrierCode: string, filters: any = {}) {
    const shipments = await prisma.networkShipment.findMany({
        where: {
            carrierCode,
            status: { notIn: ['DELIVERED', 'CANCELED', 'RETURNED', 'DRAFT', 'LABEL_PENDING'] },
            ...filters
        },
        take: 100 // Pagination/bulk chunking limit
    });

    for (const shipment of shipments) {
        if (shipment.trackingNumber) {
            await refreshTracking(shipment.id).catch(e => console.error(`Failed tracking sync for ${shipment.id}: ${e.message}`));
        }
    }
}

export async function getShipmentTimeline(shipmentId: string) {
    return prisma.networkShipmentTrackingEvent.findMany({
        where: { shipmentId },
        orderBy: { eventTime: 'asc' }
    });
}
