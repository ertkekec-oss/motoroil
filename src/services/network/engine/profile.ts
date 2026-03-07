import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { z } from 'zod';
import { ensureNetworkMembershipForTenant } from './membership';
import { NetworkProfileVisibilityLevel, NetworkVerificationStatus } from '@prisma/client';

export const UpdateProfileSchema = z.object({
    displayName: z.string().min(2),
    legalName: z.string().optional(),
    shortDescription: z.string().optional(),
    longDescription: z.string().optional(),
    logoFileKey: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    sectors: z.any().optional(),
    capabilities: z.any().optional(),
    visibilityLevel: z.enum(['PRIVATE', 'NETWORK', 'PUBLIC']).optional(),
    isPublicListingEnabled: z.boolean().optional(),
    isDiscoveryEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function getOrCreateNetworkProfile(tenantId: string) {
    await ensureNetworkMembershipForTenant(tenantId);

    let profile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId },
        include: {
            trustScore: true,
            _count: { select: { sourceRelationships: true, targetRelationships: true } }
        }
    });

    if (!profile) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const displayName = tenant?.name || `Company ${tenantId.substring(0, 8)}`;

        const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
        const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 100000)}`;

        profile = await prisma.networkCompanyProfile.create({
            data: {
                tenantId,
                slug: uniqueSlug,
                displayName,
            }
        });

        publishEvent({
            type: 'NETWORK_PROFILE_CREATED',
            tenantId,
            relatedEntityType: 'NetworkCompanyProfile',
            relatedEntityId: profile.id
        });
    }

    return profile;
}

export async function updateNetworkProfile(tenantId: string, input: UpdateProfileInput) {
    const parsedData = UpdateProfileSchema.parse(input);
    const profile = await getOrCreateNetworkProfile(tenantId);

    const updated = await prisma.networkCompanyProfile.update({
        where: { id: profile.id },
        data: parsedData as any
    });

    publishEvent({
        type: 'NETWORK_PROFILE_UPDATED',
        tenantId,
        relatedEntityType: 'NetworkCompanyProfile',
        relatedEntityId: updated.id
    });

    return updated;
}
