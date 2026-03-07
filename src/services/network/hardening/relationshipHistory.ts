import prisma from '@/lib/prisma';
import { CompanyRelationshipEventType, CompanyRelationshipStatus } from '@prisma/client';

export async function recordRelationshipEvent(
    relationshipId: string,
    sourceTenantId: string,
    targetTenantId: string,
    eventType: CompanyRelationshipEventType,
    previousStatus?: CompanyRelationshipStatus,
    nextStatus?: CompanyRelationshipStatus,
    metadata?: any,
    actorTenantId?: string,
    actorUserId?: string
) {
    return prisma.companyRelationshipEvent.create({
        data: {
            relationshipId,
            sourceTenantId,
            targetTenantId,
            eventType,
            previousStatus,
            nextStatus,
            metadata,
            actorTenantId,
            actorUserId
        }
    });
}

export async function listRelationshipHistory(relationshipId: string, viewerContext: { tenantId: string, isAdmin?: boolean }) {
    const relationship = await prisma.companyRelationship.findUnique({ where: { id: relationshipId } });
    if (!relationship) throw new Error("Not isolated or not found");

    if (!viewerContext.isAdmin && relationship.sourceTenantId !== viewerContext.tenantId && relationship.targetTenantId !== viewerContext.tenantId) {
        throw new Error("Access denied to history");
    }

    return prisma.companyRelationshipEvent.findMany({
        where: { relationshipId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function buildRelationshipTimeline(relationshipId: string) {
    const events = await prisma.companyRelationshipEvent.findMany({
        where: { relationshipId },
        orderBy: { createdAt: 'asc' }
    });

    // Simplify timeline for frontend projection
    return events.map(e => ({
        id: e.id,
        date: e.createdAt,
        type: e.eventType,
        description: ` transitioned from ${e.previousStatus || 'none'} to ${e.nextStatus || 'none'}`,
        rawMetadata: e.metadata
    }));
}
