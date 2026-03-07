import { PrismaClient, NetworkDisputeActorType, NetworkDisputeTimelineEventType } from '@prisma/client';
import { ApiError } from '@/lib/api-context';
import { AddEvidenceInput } from './disputeValidation';

const prisma = new PrismaClient();

export class DisputeEvidenceService {
    /**
     * Adds evidence to an existing dispute and audits the action.
     */
    static async addEvidence(
        tenantId: string,
        userId: string,
        disputeId: string,
        input: AddEvidenceInput
    ) {
        const dispute = await prisma.networkDispute.findUnique({
            where: { id: disputeId }
        });

        if (!dispute) {
            throw new ApiError('Dispute not found', 404, 'NOT_FOUND');
        }

        // Verify participation
        if (dispute.openedByTenantId !== tenantId && dispute.againstTenantId !== tenantId) {
            throw new ApiError('Only participants can add evidence', 403, 'DISPUTE_NOT_PARTICIPANT');
        }

        return await prisma.$transaction(async (tx) => {
            const evidence = await tx.networkDisputeEvidence.create({
                data: {
                    disputeId,
                    uploadedByTenantId: tenantId,
                    uploadedByUserId: userId,
                    evidenceType: input.evidenceType,
                    fileKey: input.fileKey,
                    fileName: input.fileName,
                    mimeType: input.mimeType,
                    textContent: input.textContent,
                    metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
                    visibilityScope: input.visibilityScope
                }
            });

            // Audit Timeline
            const actorType = dispute.openedByTenantId === tenantId
                ? NetworkDisputeActorType.BUYER
                : NetworkDisputeActorType.SELLER;

            await tx.networkDisputeTimelineEvent.create({
                data: {
                    disputeId,
                    eventType: NetworkDisputeTimelineEventType.EVIDENCE_ADDED,
                    actorType,
                    actorTenantId: tenantId,
                    actorUserId: userId,
                    summary: `Evidence added: ${input.fileName || input.evidenceType}`,
                    metadata: { evidenceId: evidence.id, type: input.evidenceType }
                }
            });

            // Publishing event
            // eventBus.publish('DISPUTE_EVIDENCE_ADDED', { evidenceId: evidence.id, disputeId })

            return evidence;
        });
    }

    /**
     * Checks if a user/tenant is allowed to access specific evidence.
     */
    static async checkEvidenceAccess(tenantId: string, isAdmin: boolean, evidenceId: string) {
        const evidence = await prisma.networkDisputeEvidence.findUnique({
            where: { id: evidenceId },
            include: { dispute: true }
        });

        if (!evidence) {
            throw new ApiError('Evidence not found', 404, 'NOT_FOUND');
        }

        if (isAdmin) return evidence;

        if (evidence.visibilityScope === 'ADMIN_ONLY') {
            throw new ApiError('This evidence is restricted to platform administrators.', 403, 'EVIDENCE_ACCESS_DENIED');
        }

        if (evidence.visibilityScope === 'UPLOADER_AND_ADMIN' && evidence.uploadedByTenantId !== tenantId) {
            throw new ApiError('You do not have permission to view this evidence.', 403, 'EVIDENCE_ACCESS_DENIED');
        }

        const { dispute } = evidence;
        if (dispute.openedByTenantId !== tenantId && dispute.againstTenantId !== tenantId) {
            throw new ApiError('You are not a participant in this dispute.', 403, 'EVIDENCE_ACCESS_DENIED');
        }

        return evidence;
    }
}

