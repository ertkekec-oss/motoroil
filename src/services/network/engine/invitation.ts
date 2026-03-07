import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { z } from 'zod';
import { getOrCreateNetworkProfile } from './profile';
import { CompanyRelationshipType } from '@prisma/client';

export const SendInviteSchema = z.object({
    toTenantId: z.string(),
    proposedRelationshipType: z.nativeEnum(CompanyRelationshipType),
    message: z.string().optional()
});

export type SendInviteInput = z.infer<typeof SendInviteSchema>;

export async function sendConnectionInvite(currentTenantId: string, payload: SendInviteInput) {
    const data = SendInviteSchema.parse(payload);

    if (currentTenantId === data.toTenantId) {
        throw new Error("Cannot send invite to self");
    }

    const fromProfile = await getOrCreateNetworkProfile(currentTenantId);
    const toProfile = await getOrCreateNetworkProfile(data.toTenantId);

    // Check if invite exists
    const existingInvite = await prisma.networkConnectionInvite.findFirst({
        where: {
            fromTenantId: currentTenantId,
            toTenantId: data.toTenantId,
            status: 'PENDING'
        }
    });

    if (existingInvite) {
        throw new Error("Already sent a pending invite to this tenant");
    }

    const invite = await prisma.networkConnectionInvite.create({
        data: {
            fromTenantId: currentTenantId,
            toTenantId: data.toTenantId,
            fromProfileId: fromProfile.id,
            toProfileId: toProfile.id,
            proposedRelationshipType: data.proposedRelationshipType,
            message: data.message,
            status: 'PENDING',
        }
    });

    publishEvent({
        type: 'NETWORK_INVITATION_SENT',
        tenantId: data.toTenantId, // sending to target
        relatedEntityType: 'NetworkConnectionInvite',
        relatedEntityId: invite.id,
        meta: { fromTenantId: currentTenantId }
    });

    return invite;
}

export async function acceptConnectionInvite(currentTenantId: string, inviteId: string) {
    const invite = await prisma.networkConnectionInvite.findUnique({
        where: { id: inviteId }
    });

    if (!invite || invite.toTenantId !== currentTenantId) {
        throw new Error("Invite not found or access denied");
    }

    if (invite.status !== 'PENDING') {
        throw new Error("Invite is not pending");
    }

    // Create the relationship edge in a transaction
    const [updated, relationship] = await prisma.$transaction([
        prisma.networkConnectionInvite.update({
            where: { id: inviteId },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date()
            }
        }),
        prisma.companyRelationship.create({
            data: {
                sourceTenantId: invite.fromTenantId,
                targetTenantId: invite.toTenantId,
                sourceProfileId: invite.fromProfileId,
                targetProfileId: invite.toProfileId,
                relationshipType: invite.proposedRelationshipType,
                status: 'ACTIVE',
                initiatedByTenantId: invite.fromTenantId,
                approvedByTenantId: currentTenantId,
                connectedAt: new Date()
            }
        })
    ]);

    publishEvent({
        type: 'NETWORK_INVITATION_ACCEPTED',
        tenantId: invite.fromTenantId, // notify source
        relatedEntityType: 'NetworkConnectionInvite',
        relatedEntityId: invite.id
    });

    publishEvent({
        type: 'NETWORK_RELATIONSHIP_ACTIVATED',
        tenantId: currentTenantId,
        relatedEntityType: 'CompanyRelationship',
        relatedEntityId: relationship.id
    });

    return { invite: updated, relationship };
}

export async function rejectConnectionInvite(currentTenantId: string, inviteId: string) {
    const invite = await prisma.networkConnectionInvite.findUnique({
        where: { id: inviteId }
    });

    if (!invite || invite.toTenantId !== currentTenantId) {
        throw new Error("Invite not found or access denied");
    }

    if (invite.status !== 'PENDING') {
        throw new Error("Invite is not pending");
    }

    const updated = await prisma.networkConnectionInvite.update({
        where: { id: inviteId },
        data: {
            status: 'REJECTED',
            respondedAt: new Date()
        }
    });

    publishEvent({
        type: 'NETWORK_INVITATION_REJECTED',
        tenantId: invite.fromTenantId,
        relatedEntityType: 'NetworkConnectionInvite',
        relatedEntityId: invite.id
    });

    return updated;
}
