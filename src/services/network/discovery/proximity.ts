import prisma from '@/lib/prisma';

export async function calculateNetworkProximity(viewerTenantId: string, targetTenantId: string): Promise<number> {
    if (viewerTenantId === targetTenantId) return 100;

    let score = 0;

    // 1. Direct relationship?
    const directRel = await prisma.companyRelationship.findFirst({
        where: {
            OR: [
                { sourceTenantId: viewerTenantId, targetTenantId: targetTenantId },
                { sourceTenantId: targetTenantId, targetTenantId: viewerTenantId }
            ],
            status: 'ACTIVE'
        }
    });

    if (directRel) {
        score += 50;
    } else {
        // 2. Mutual relationships?
        const viewerRels = await prisma.companyRelationship.findMany({
            where: {
                OR: [{ sourceTenantId: viewerTenantId }, { targetTenantId: viewerTenantId }],
                status: 'ACTIVE'
            },
            select: { sourceTenantId: true, targetTenantId: true }
        });

        const targetRels = await prisma.companyRelationship.findMany({
            where: {
                OR: [{ sourceTenantId: targetTenantId }, { targetTenantId: targetTenantId }],
                status: 'ACTIVE'
            },
            select: { sourceTenantId: true, targetTenantId: true }
        });

        const viewerConnections = new Set(
            viewerRels.map(r => r.sourceTenantId === viewerTenantId ? r.targetTenantId : r.sourceTenantId)
        );

        let mutualCount = 0;
        for (const rel of targetRels) {
            const connectedId = rel.sourceTenantId === targetTenantId ? rel.targetTenantId : rel.sourceTenantId;
            if (viewerConnections.has(connectedId)) mutualCount++;
        }

        if (mutualCount > 0) score += 20 + Math.min(20, mutualCount * 5); // Max 40 from mutual
    }

    // 3. Shared Categories
    const viewerProfile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId: viewerTenantId },
        select: { id: true }
    });
    const targetProfile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId: targetTenantId },
        select: { id: true }
    });

    if (viewerProfile && targetProfile) {
        const viewerCategories = await prisma.networkCategorySignal.findMany({
            where: { profileId: viewerProfile.id }
        });
        const targetCategories = await prisma.networkCategorySignal.findMany({
            where: { profileId: targetProfile.id }
        });

        const viewerCatSet = new Set(viewerCategories.map(c => c.categoryId));
        let sharedCats = 0;
        for (const c of targetCategories) {
            if (viewerCatSet.has(c.categoryId)) sharedCats++;
        }

        score += Math.min(10, sharedCats * 2);
    }

    return Math.min(100, score);
}
