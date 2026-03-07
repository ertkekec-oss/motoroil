import { PrismaClient, NetworkDisputeStatus, NetworkShipmentTrackingNormalizedStatus, NetworkEscrowLifecycleEventType, NetworkDisputeTimelineEventType, NetworkDisputeActorType } from '@prisma/client';

export async function onShipmentEventReceived(
    tx: any,
    shipmentId: string,
    status: NetworkShipmentTrackingNormalizedStatus,
    details: string
) {
    // If shipment gets DELIVERED, and there's a dispute waiting for shipment (e.g., DELIVERY_DELAY)
    const dispute = await tx.networkDispute.findFirst({
        where: {
            shipmentId,
            status: { notIn: [NetworkDisputeStatus.CLOSED, NetworkDisputeStatus.RESOLVED] }
        }
    });

    if (!dispute) return;

    // Add event to dispute
    const eventType = status === 'DELIVERED' ? NetworkDisputeTimelineEventType.SHIPMENT_DELIVERED
        : status === 'DELIVERY_EXCEPTION' ? NetworkDisputeTimelineEventType.SHIPMENT_FAILED
            : null;

    if (eventType) {
        await tx.networkDisputeTimelineEvent.create({
            data: {
                disputeId: dispute.id,
                eventType,
                actorType: NetworkDisputeActorType.SYSTEM,
                summary: `Carrier reported: ${status} - ${details}`,
            }
        });

        // We do NOT auto-resolve disputes here safely, but we COULD advance out of EVIDENCE_PENDING
        // if delivery proof was all we were waiting for. For now, leave to manual state machine transitions.
    }
}

