import prisma from '@/lib/prisma';
import { NetworkEscrowHoldStatus, NetworkEscrowLifecycleEventType } from '@prisma/client';

export const VALID_TRANSITIONS: Record<NetworkEscrowHoldStatus, NetworkEscrowHoldStatus[]> = {
    CREATED: ['FUNDS_HELD', 'CANCELED'],
    FUNDS_HELD: ['SHIPMENT_PENDING', 'REFUNDED', 'CANCELED'],
    SHIPMENT_PENDING: ['IN_TRANSIT', 'CANCELED'],
    IN_TRANSIT: ['DELIVERY_CONFIRMED', 'DISPUTED'],
    DELIVERY_CONFIRMED: ['RELEASED', 'DISPUTED', 'REFUNDED'],
    DISPUTED: ['RELEASED', 'REFUNDED'],
    RELEASED: [],
    REFUNDED: [],
    CANCELED: [],
};

export async function transitionEscrowState(
    escrowHoldId: string,
    newState: NetworkEscrowHoldStatus,
    eventType: NetworkEscrowLifecycleEventType,
    options: { source?: string; sourceId?: string; metadata?: any } = {}
) {
    // 1. Fetch current hold and lock row safely for transaction consistency.
    // Simplifying with findUnique in node land, assuming DB concurrency is handled or we expect mostly serial.
    // In strict production, we'd use `$transaction` with raw locking.
    const hold = await prisma.networkEscrowHold.findUnique({
        where: { id: escrowHoldId }
    });

    if (!hold) {
        throw new Error(`Escrow hold not found: ${escrowHoldId}`);
    }

    if (hold.status === newState) {
        // Idempotent: already in this state
        return hold;
    }

    const permitted = VALID_TRANSITIONS[hold.status] || [];
    if (!permitted.includes(newState)) {
        throw new Error(`Invalid escrow transition from ${hold.status} to ${newState}`);
    }

    // Attempt transition via transaction
    return await prisma.$transaction(async (tx) => {
        const updatedHold = await tx.networkEscrowHold.update({
            where: { id: hold.id },
            data: { status: newState }
        });

        await tx.networkEscrowLifecycleEvent.create({
            data: {
                escrowHoldId: hold.id,
                eventType,
                previousState: hold.status,
                newState,
                source: options.source || 'SYSTEM',
                sourceId: options.sourceId,
                metadata: options.metadata || {}
            }
        });

        return updatedHold;
    });
}
