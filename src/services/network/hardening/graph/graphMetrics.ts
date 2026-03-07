import prisma from '@/lib/prisma';

export async function recomputeGraphMetrics(tenantId: string) {
    const activeSuppliers = await prisma.companyRelationship.count({
        where: { targetTenantId: tenantId, relationshipType: 'SUPPLIER', status: 'ACTIVE' }
    });

    const activeBuyers = await prisma.companyRelationship.count({
        where: { sourceTenantId: tenantId, relationshipType: 'SUPPLIER', status: 'ACTIVE' }
    });

    const directConnections = activeSuppliers + activeBuyers;

    const lastEvent = await prisma.companyRelationshipEvent.findFirst({
        where: { OR: [{ sourceTenantId: tenantId }, { targetTenantId: tenantId }] },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
    });
    const lastRelationshipEventId = lastEvent?.id || null;

    await prisma.companyGraphMetricSnapshot.upsert({
        where: { tenantId },
        create: {
            tenantId,
            directConnectionsCount: directConnections,
            activeSuppliersCount: activeSuppliers,
            activeBuyersCount: activeBuyers,
            lastRelationshipEventId,
            lastComputedAt: new Date(),
            isStale: false
        },
        update: {
            directConnectionsCount: directConnections,
            activeSuppliersCount: activeSuppliers,
            activeBuyersCount: activeBuyers,
            lastRelationshipEventId,
            lastComputedAt: new Date(),
            isStale: false
        }
    });
}
