import { PrismaClient, NetworkDisputeStatus, NetworkDisputeActorType, NetworkDisputeTimelineEventType } from '@prisma/client';
import { ApiError } from '@/lib/api-context';
import { OpenDisputeInput, RespondDisputeInput } from './disputeValidation';
import { DisputeStateMachine } from './disputeStateMachine';
import { lockEscrowForDispute, releaseEscrowFromDispute } from './escrowHooks';

const prisma = new PrismaClient();

export class DisputeService {
    /**
     * Opens a new dispute, ensuring no duplicates exist for the same order/tenant.
     * Also locks the associated escrow account if applicable.
     */
    static async openDispute(tenantId: string, userId: string, input: OpenDisputeInput) {
        // 1. Prevent duplicate disputes
        const existing = await prisma.networkDispute.findFirst({
            where: {
                orderId: input.orderId,
                status: {
                    notIn: [NetworkDisputeStatus.CLOSED, NetworkDisputeStatus.REJECTED, NetworkDisputeStatus.RESOLVED]
                }
            }
        });

        if (existing) {
            throw new ApiError('An active dispute already exists for this order.', 400, 'DUPLICATE_DISPUTE_BLOCKED');
        }

        return await prisma.$transaction(async (tx) => {
            // 2. Create the Dispute
            const dispute = await tx.networkDispute.create({
                data: {
                    tenantId: tenantId,
                    orderId: input.orderId,
                    shipmentId: input.shipmentId,
                    escrowHoldId: input.escrowHoldId,
                    openedByTenantId: tenantId,
                    againstTenantId: input.againstTenantId,
                    disputeType: input.disputeType,
                    status: NetworkDisputeStatus.OPEN,
                    priority: input.priority,
                    title: input.title,
                    summary: input.summary,
                    claimedAmount: input.claimedAmount,
                    currency: input.currency ?? 'TRY',
                }
            });

            // 3. Add to timeline
            await tx.networkDisputeTimelineEvent.create({
                data: {
                    disputeId: dispute.id,
                    eventType: NetworkDisputeTimelineEventType.DISPUTE_OPENED,
                    actorType: NetworkDisputeActorType.BUYER, // Assuming buyer opens it, maybe dynamic?
                    actorTenantId: tenantId,
                    actorUserId: userId,
                    summary: `Dispute opened by ${tenantId}: ${input.title}`,
                    metadata: { reason: input.disputeType }
                }
            });

            // 4. Hook to lock Escrow
            if (input.escrowHoldId) {
                await lockEscrowForDispute(tx, input.escrowHoldId, dispute.id, tenantId);

                await tx.networkDisputeTimelineEvent.create({
                    data: {
                        disputeId: dispute.id,
                        eventType: NetworkDisputeTimelineEventType.ESCROW_LOCKED,
                        actorType: NetworkDisputeActorType.SYSTEM,
                        summary: `Escrow hold ${input.escrowHoldId} automatically locked due to dispute`,
                    }
                });
            }

            // Publish event
            // eventBus.publish('DISPUTE_OPENED', dispute)

            return dispute;
        });
    }

    /**
     * Safe status transition wrapper that uses the StateMachine
     */
    static async transitionStatus(
        tx: any,
        disputeId: string,
        currentStatus: NetworkDisputeStatus,
        targetStatus: NetworkDisputeStatus,
        actorId: string,
        reason: string
    ) {
        DisputeStateMachine.validateTransition(currentStatus, targetStatus);

        const dispute = await tx.networkDispute.update({
            where: { id: disputeId },
            data: { status: targetStatus }
        });

        await tx.networkDisputeTimelineEvent.create({
            data: {
                disputeId: disputeId,
                eventType: NetworkDisputeTimelineEventType.ADMIN_NOTE_ADDED,
                actorType: NetworkDisputeActorType.SYSTEM,
                actorUserId: actorId,
                summary: `Status transitioned from ${currentStatus} to ${targetStatus}: ${reason}`,
            }
        });

        return dispute;
    }
}

