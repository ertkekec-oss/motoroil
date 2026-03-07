import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';

export async function getRoutingPolicyForTenant(tenantId: string) {
    const policy = await prisma.networkRoutingPolicy.findUnique({
        where: { tenantId }
    });
    return policy;
}

export async function upsertRoutingPolicy(tenantId: string, input: any) {
    const policy = await prisma.networkRoutingPolicy.upsert({
        where: { tenantId },
        update: {
            ...input
        },
        create: {
            tenantId,
            autoRoutingEnabled: input.autoRoutingEnabled ?? false,
            maxPrimarySuppliers: input.maxPrimarySuppliers ?? 3,
            maxFallbackSuppliers: input.maxFallbackSuppliers ?? 5,
            minTrustScore: input.minTrustScore ?? 50,
            minConfidenceScore: input.minConfidenceScore ?? 60,
            allowWaveRouting: input.allowWaveRouting ?? true,
            allowAutoDraftCreation: input.allowAutoDraftCreation ?? false,
            requireManualApprovalBeforeSend: input.requireManualApprovalBeforeSend ?? true,
            preferredSupplierTypes: input.preferredSupplierTypes,
            excludedSupplierIds: input.excludedSupplierIds
        }
    });

    await publishEvent({
        type: 'NETWORK_ROUTING_POLICY_UPDATED',
        tenantId,
        meta: { policyId: policy.id }
    });

    return policy;
}

export async function resolveEffectiveRoutingPolicy(tenantId: string) {
    let policy = await getRoutingPolicyForTenant(tenantId);
    if (!policy) {
        // Safe defaults
        policy = await upsertRoutingPolicy(tenantId, {});
    }
    return policy;
}
