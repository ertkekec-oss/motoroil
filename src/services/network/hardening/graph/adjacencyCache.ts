import prisma from '@/lib/prisma';

export async function recomputeAdjacencyForTenant(tenantId: string) {
    // Note: Graph complexity logic to cache relationship proximity
    // Here we clear old and write new to simulate materialization job
    await prisma.companyGraphAdjacencyCache.updateMany({
        where: { tenantId },
        data: { isStale: true }
    });

    const relationships = await prisma.companyRelationship.findMany({
        where: { OR: [{ sourceTenantId: tenantId }, { targetTenantId: tenantId }] }
    });

    const lastEvent = await prisma.companyRelationshipEvent.findFirst({
        where: { OR: [{ sourceTenantId: tenantId }, { targetTenantId: tenantId }] },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
    });
    const lastRelationshipEventId = lastEvent?.id || null;

    for (const rel of relationships) {
        const neighborTenantId = rel.sourceTenantId === tenantId ? rel.targetTenantId : rel.sourceTenantId;

        await prisma.companyGraphAdjacencyCache.upsert({
            where: { tenantId_neighborTenantId: { tenantId, neighborTenantId } },
            create: {
                tenantId,
                neighborTenantId,
                directConnection: true,
                relationshipCount: 1,
                lastRelationshipEventId,
                lastComputedAt: new Date()
            },
            update: {
                directConnection: true,
                isStale: false,
                lastRelationshipEventId,
                lastComputedAt: new Date()
            }
        });
    }

    return true;
}
