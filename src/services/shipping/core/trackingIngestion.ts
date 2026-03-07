import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

export interface TrackingEventIngestInput {
    shipmentId: string;
    shipmentPackageId?: string;
    carrierCode: string;
    externalEventId: string | null;
    carrierEventCode: string | null;
    normalizedStatus: NetworkShipmentTrackingNormalizedStatus;
    locationText?: string | null;
    description?: string | null;
    rawPayload: any;
    eventTime: Date;
}

export async function upsertTrackingEventSafely(input: TrackingEventIngestInput) {
    const rawHash = crypto.createHash('md5').update(JSON.stringify(input.rawPayload)).digest('hex');
    const timeKey = input.eventTime.getTime().toString();
    const dedupeKey = `${input.carrierCode}_${input.shipmentId}_${input.externalEventId || rawHash}_${timeKey}`;

    return prisma.networkShipmentTrackingEvent.upsert({
        where: { dedupeKey },
        create: {
            shipmentId: input.shipmentId,
            shipmentPackageId: input.shipmentPackageId || null,
            carrierCode: input.carrierCode,
            externalEventId: input.externalEventId,
            carrierEventCode: input.carrierEventCode,
            normalizedStatus: input.normalizedStatus,
            locationText: input.locationText || null,
            description: input.description || null,
            rawPayload: input.rawPayload,
            eventTime: input.eventTime,
            dedupeKey
        },
        update: {
            // Already seen this exact event, don't change core immutable fields
            processedAt: new Date()
        }
    });
}

export async function ingestTrackingEvent(input: TrackingEventIngestInput) {
    // 1. Upsert securely (Idempotency)
    const event = await upsertTrackingEventSafely(input);

    // 2. Cascade state progression if necessary
    const shipment = await prisma.networkShipment.findUnique({ where: { id: input.shipmentId } });
    if (!shipment) return event;

    // Evaluate progression
    const progressionScore = {
        'DRAFT': 0,
        'LABEL_PENDING': 1,
        'LABEL_CREATED': 2,
        'READY_FOR_PICKUP': 3,
        'PICKED_UP': 4,
        'IN_TRANSIT': 5,
        'OUT_FOR_DELIVERY': 6,
        'DELIVERY_EXCEPTION': 6.5,
        'DELIVERED': 7,
        'RETURNED': 8,
        'CANCELED': 9,
        'DELIVERY_FAILED': 9
    };

    const currentScore = progressionScore[shipment.status] || 0;
    const incomingScore = progressionScore[input.normalizedStatus] || 0;

    if (incomingScore > currentScore) {
        let updateData: any = { status: input.normalizedStatus };

        if (input.normalizedStatus === 'PICKED_UP') {
            updateData.shippedAt = input.eventTime;
            updateData.pickedUpAt = input.eventTime;
        } else if (input.normalizedStatus === 'DELIVERED') {
            updateData.deliveredAt = input.eventTime;
        }

        await prisma.networkShipment.update({
            where: { id: shipment.id },
            data: updateData
        });

        // FUTURE PHASE: Broadcast Event (SHIPMENT_DELIVERED -> triggers Escrow auto-release)
        // await publishEvent('SHIPMENT_DELIVERED', { shipmentId: shipment.id });
    }

    return event;
}

export async function ingestCarrierWebhook(carrierCode: string, payload: any) {
    throw new Error('Not Implemented - Future sync entrypoint for Webhook/Polling foundation');
}
