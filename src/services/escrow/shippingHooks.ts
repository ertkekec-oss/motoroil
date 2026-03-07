import prisma from '@/lib/prisma';
import { transitionEscrowState } from './escrowStateMachine';
import { scheduleRelease } from './escrowReleaseEngine';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

export async function handleShippingEvent(
    shipmentId: string,
    orderId: string,
    status: NetworkShipmentTrackingNormalizedStatus,
    eventTime?: Date
) {
    const hold = await prisma.networkEscrowHold.findUnique({
        where: { orderId }
    });

    if (!hold) return null; // No escrow connected to this order

    switch (status) {
        case 'LABEL_CREATED':
            if (hold.status === 'FUNDS_HELD') {
                return transitionEscrowState(hold.id, 'SHIPMENT_PENDING', 'SHIPMENT_CREATED', {
                    source: 'CARRIER_HOOK',
                    sourceId: shipmentId
                });
            }
            break;

        case 'PICKED_UP':
        case 'IN_TRANSIT':
            if (['FUNDS_HELD', 'SHIPMENT_PENDING'].includes(hold.status)) {
                return transitionEscrowState(hold.id, 'IN_TRANSIT', 'SHIPMENT_PICKED_UP', {
                    source: 'CARRIER_HOOK',
                    sourceId: shipmentId
                });
            }
            break;

        case 'DELIVERED':
            if (['FUNDS_HELD', 'SHIPMENT_PENDING', 'IN_TRANSIT'].includes(hold.status)) {
                const updatedHold = await transitionEscrowState(hold.id, 'DELIVERY_CONFIRMED', 'SHIPMENT_DELIVERED', {
                    source: 'CARRIER_HOOK',
                    sourceId: shipmentId
                });
                // Automatic Delivery Release Queue Trigger
                await scheduleRelease(updatedHold.id);
                return updatedHold;
            }
            break;

        case 'DELIVERY_EXCEPTION':
            if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(hold.status)) {
                // Potential dispute/freeze alert via exception
            }
            break;

        case 'RETURNED':
        case 'CANCELED':
            // Logic handled by Dispute/Return system mostly, potentially freeze or cancel
            if (['CREATED', 'FUNDS_HELD'].includes(hold.status) && status === 'CANCELED') {
                return transitionEscrowState(hold.id, 'CANCELED', 'SHIPMENT_DELIVERY_FAILED', {
                    source: 'CARRIER_HOOK',
                    sourceId: shipmentId
                });
            }
            break;
    }

    return null;
}
