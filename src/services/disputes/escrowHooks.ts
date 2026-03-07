import { PrismaClient, NetworkEscrowHoldStatus, NetworkEscrowLifecycleEventType } from '@prisma/client';
import { ApiError } from '@/lib/api-context';

export async function lockEscrowForDispute(
    tx: any,
    escrowHoldId: string,
    disputeId: string,
    initiatorTenantId: string
) {
    // Ensure escrow is not already released or refunded
    const escrowHold = await tx.networkEscrowHold.findUnique({
        where: { id: escrowHoldId }
    });

    if (!escrowHold) {
        throw new ApiError('Escrow hold not found for locking.', 404, 'NOT_FOUND');
    }

    if (escrowHold.status === NetworkEscrowHoldStatus.RELEASED || escrowHold.status === NetworkEscrowHoldStatus.REFUNDED) {
        throw new ApiError(`Cannot lock escrow in status ${escrowHold.status}`, 400, 'ESCROW_LOCK_FAILED');
    }

    // Idempotency: if already DISPUTED, do not transition again
    if (escrowHold.status === NetworkEscrowHoldStatus.DISPUTED) {
        return escrowHold;
    }

    const updatedEscrow = await tx.networkEscrowHold.update({
        where: { id: escrowHoldId },
        data: { status: NetworkEscrowHoldStatus.DISPUTED }
    });

    await tx.networkEscrowLifecycleEvent.create({
        data: {
            escrowHoldId,
            eventType: NetworkEscrowLifecycleEventType.DISPUTE_OPENED,
            previousState: escrowHold.status,
            newState: NetworkEscrowHoldStatus.DISPUTED,
            source: 'DISPUTE_ENGINE',
            sourceId: disputeId,
            metadata: { disputeId, initiatorTenantId }
        }
    });

    return updatedEscrow;
}

export async function releaseEscrowFromDispute(
    tx: any,
    escrowHoldId: string,
    disputeId: string,
    decision: 'RELEASE_FULL' | 'REFUND_FULL' | 'PARTIAL'
) {
    const escrowHold = await tx.networkEscrowHold.findUnique({
        where: { id: escrowHoldId }
    });

    if (!escrowHold || escrowHold.status !== NetworkEscrowHoldStatus.DISPUTED) {
        return; // Already resolved or not in a disputed state, idempotent exit
    }

    let nextStatus: NetworkEscrowHoldStatus = NetworkEscrowHoldStatus.DISPUTED; // Fallback
    // Note: Depending on actual settlement rules, we might route this to financial engine.
    // For Layer 2 integration, we just mark it as resolved from dispute.
    if (decision === 'RELEASE_FULL') {
        nextStatus = NetworkEscrowHoldStatus.RELEASED;
    } else if (decision === 'REFUND_FULL') {
        nextStatus = NetworkEscrowHoldStatus.REFUNDED;
    }

    const updatedEscrow = await tx.networkEscrowHold.update({
        where: { id: escrowHoldId },
        data: { status: nextStatus }
    });

    await tx.networkEscrowLifecycleEvent.create({
        data: {
            escrowHoldId,
            eventType: NetworkEscrowLifecycleEventType.DISPUTE_RESOLVED,
            previousState: escrowHold.status,
            newState: nextStatus,
            source: 'DISPUTE_ENGINE',
            sourceId: disputeId,
            metadata: { disputeId, decision }
        }
    });

    return updatedEscrow;
}

