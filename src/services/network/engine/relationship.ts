import prisma from '@/lib/prisma';
import { CompanyRelationship, Prisma } from '@prisma/client';

export async function listTenantConnections(currentTenantId: string, filters?: { status?: string, type?: string }) {
    const where: Prisma.CompanyRelationshipWhereInput = {
        OR: [
            { sourceTenantId: currentTenantId },
            { targetTenantId: currentTenantId }
        ]
    };

    if (filters?.status) {
        where.status = filters.status as any;
    }

    if (filters?.type) {
        where.relationshipType = filters.type as any;
    }

    const connections = await prisma.companyRelationship.findMany({
        where,
        include: {
            sourceProfile: true,
            targetProfile: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return connections;
}

export async function getConnectionDetails(currentTenantId: string, relationshipId: string) {
    const relationship = await prisma.companyRelationship.findUnique({
        where: { id: relationshipId },
        include: {
            sourceProfile: true,
            targetProfile: true
        }
    });

    if (!relationship) {
        throw new Error("Relationship not found");
    }

    if (relationship.sourceTenantId !== currentTenantId && relationship.targetTenantId !== currentTenantId) {
        throw new Error("Access denied");
    }

    return relationship;
}
