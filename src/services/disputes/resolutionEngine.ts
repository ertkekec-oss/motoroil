import { PrismaClient, NetworkDisputeStatus, NetworkDisputeDecision, NetworkDisputeDecidedByType, NetworkDisputeActorType, NetworkDisputeTimelineEventType } from '@prisma/client';
import { ApiError } from '@/lib/api-context';
import { ResolveDisputeInput } from './disputeValidation';
import { DisputeStateMachine } from './disputeStateMachine';
import { releaseEscrowFromDispute } from './escrowHooks';
import { DisputeService } from './disputeService';

const prisma = new PrismaClient();

export class DisputeResolutionEngine {
    /**
     * Applies an admin/system resolution to a dispute, transitioning the state and unlocking escrow.
     */
    static async resolveDispute(
        adminUserId: string,
        disputeId: string,
        input: ResolveDisputeInput,
        resolverType: NetworkDisputeDecidedByType = NetworkDisputeDecidedByType.ADMIN
    ) {
        const dispute = await prisma.networkDispute.findUnique({
            where: { id: disputeId }
        });

        if (!dispute) {
            throw new ApiError('Dispute not found', 404, 'NOT_FOUND');
        }

        if (DisputeStateMachine.isTerminalState(dispute.status)) {
            throw new ApiError(`Dispute is already in a terminal state: ${dispute.status}`, 400, 'RESOLUTION_ALREADY_APPLIED');
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Transition state to RESOLVED
            await DisputeService.transitionStatus(
                tx,
                disputeId,
                dispute.status,
                NetworkDisputeStatus.RESOLVED,
                adminUserId,
                input.notes
            );

            // 2. Create Resolution record
            const resolution = await tx.networkDisputeResolution.create({
                data: {
                    disputeId: dispute.id,
                    decidedByType: resolverType,
                    decidedByUserId: adminUserId,
                    decision: input.decision,
                    refundAmount: input.refundAmount,
                    releaseAmount: input.releaseAmount,
                    notes: input.notes,
                }
            });

            // 3. Create Timeline Event
            await tx.networkDisputeTimelineEvent.create({
                data: {
                    disputeId: dispute.id,
                    eventType: NetworkDisputeTimelineEventType.DISPUTE_RESOLVED,
                    actorType: NetworkDisputeActorType.ADMIN,
                    actorUserId: adminUserId,
                    summary: `Dispute resolved with decision: ${input.decision}`,
                    metadata: { resolutionId: resolution.id, notes: input.notes }
                }
            });

            // 4. Update core Dispute record
            await tx.networkDispute.update({
                where: { id: dispute.id },
                data: {
                    resolutionType: input.decision,
                    resolutionSummary: `Resolved by ${resolverType}. ` + input.notes,
                    resolvedAt: new Date()
                }
            });

            // 5. Handle Escrow Release/Refund if linked
            if (dispute.escrowHoldId) {
                let decisionType: 'RELEASE_FULL' | 'REFUND_FULL' | 'PARTIAL' = 'PARTIAL';
                if (input.decision === NetworkDisputeDecision.FULL_RELEASE || input.decision === NetworkDisputeDecision.REJECT_CLAIM) {
                    decisionType = 'RELEASE_FULL';
                } else if (input.decision === NetworkDisputeDecision.FULL_REFUND) {
                    decisionType = 'REFUND_FULL';
                }

                await releaseEscrowFromDispute(tx, dispute.escrowHoldId, dispute.id, decisionType);
            }

            // Hook point for Trust Engine & Risk Scoring
            // eventBus.publish('DISPUTE_RESOLVED', { disputeId, decision: input.decision, ... })

            return resolution;
        });
    }
}

