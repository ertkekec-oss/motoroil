import { prisma } from '@/lib/prisma';
import { ShipmentStatus } from '@prisma/client';

export interface WebhookShipmentEvent {
    carrierCode: string;
    carrierEventId: string;
    trackingNumber: string;
    status: ShipmentStatus;
    description: string;
    rawPayload: any;
}

export async function processShipmentEvent(payload: WebhookShipmentEvent) {
    let inbox;
    try {
        // 1. Check idempotency inbox for duplicated webhooks from the carrier.
        const existingEvent = await prisma.shipmentEventInbox.findUnique({
            where: { carrierEventId: payload.carrierEventId }
        });

        if (existingEvent) {
            return true;
        }

        inbox = await prisma.shipmentEventInbox.create({
            data: {
                carrierCode: payload.carrierCode,
                carrierEventId: payload.carrierEventId,
                trackingNumber: payload.trackingNumber,
                raw: payload.rawPayload || {},
                status: 'RECEIVED'
            }
        });
    } catch (e: any) {
        if (e.code === 'P2002') {
            return true; // Another process inserted the idempotent lock.
        }
        throw e;
    }

    try {
        const shipment = await prisma.shipment.findFirst({
            where: { trackingNumber: payload.trackingNumber, carrierCode: payload.carrierCode }
        });

        if (!shipment) {
            throw new Error(`Shipment with tracking ${payload.trackingNumber} not found.`);
        }

        // Attach shipment ID to inbox
        await updateInbox(inbox.id, 'RECEIVED', undefined, shipment.id);

        if (shipment.status === 'COMPLETED' || shipment.status === 'DELIVERED') {
            // Ignoring events for finalized shipments for strictness
            if (payload.status !== 'COMPLETED' && payload.status !== 'DELIVERED') {
                await updateInbox(inbox.id, 'IGNORED', 'Shipment already completed');
                return true;
            }
        }

        // Apply state machine via transactions
        await prisma.$transaction(async (tx) => {
            await tx.shipment.update({
                where: { id: shipment.id },
                data: { status: payload.status }
            });

            await tx.shipmentEvent.create({
                data: {
                    shipmentId: shipment.id,
                    status: payload.status,
                    description: payload.description,
                    occurredAt: new Date()
                }
            });

            if (payload.status === 'DELIVERED') {
                const remaining = await tx.shipment.count({
                    where: {
                        networkOrderId: shipment.networkOrderId,
                        NOT: { status: 'DELIVERED' }
                    }
                });

                if (remaining === 0) {
                    await tx.networkOrder.update({
                        where: { id: shipment.networkOrderId },
                        data: { status: 'DELIVERED' }
                    });
                }
            }
        });

        await updateInbox(inbox.id, 'PROCESSED');
        return true;

    } catch (e: any) {
        if (inbox) {
            await updateInbox(inbox.id, 'FAILED', e.message);
        }
        return false;
    }
}

async function updateInbox(id: string, status: 'PROCESSED' | 'IGNORED' | 'FAILED' | 'RECEIVED', errorMessage?: string, shipmentId?: string) {
    await prisma.shipmentEventInbox.update({
        where: { id },
        data: {
            status,
            errorMessage: errorMessage || null,
            shipmentId: shipmentId || undefined,
            processedAt: status !== 'RECEIVED' ? new Date() : null
        }
    });
}
