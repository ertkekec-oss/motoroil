import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';

export async function ensureNetworkMembershipForTenant(tenantId: string) {
    let membership = await prisma.networkMembership.findUnique({
        where: { tenantId }
    });

    if (!membership) {
        membership = await prisma.networkMembership.create({
            data: {
                tenantId,
                status: 'PENDING',
                discoveryEnabled: false
            }
        });

        publishEvent({
            type: 'NETWORK_MEMBERSHIP_CREATED',
            tenantId,
            relatedEntityType: 'NetworkMembership',
            relatedEntityId: membership.id
        });
    }

    return membership;
}
