import { PrismaClient, BoostScope } from '@prisma/client';

const prisma = new PrismaClient();

export async function fetchActiveBoosts() {
    const now = new Date();
    // Fetch and order by priority desc, then createdAt desc for deterministic tie breaking
    return await prisma.boostRule.findMany({
        where: {
            isActive: true,
            startsAt: { lte: now },
            endsAt: { gte: now }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });
}

export async function createBoostRule(params: {
    scope: BoostScope;
    targetId: string;
    multiplier: number;
    startsAt: Date;
    endsAt: Date;
    createdByTenantId: string;
    priority?: number;
}) {
    // 1. Multiplier Clamp: [1.0, 3.0]
    if (params.multiplier < 1.0 || params.multiplier > 3.0) {
        throw new Error('Boost multiplier must be between 1.0 and 3.0');
    }

    if (!params.endsAt) {
        throw new Error('EndsAt must be provided');
    }

    if (params.endsAt <= params.startsAt) {
        throw new Error('EndsAt must be after StartsAt');
    }

    // Maximum 90-day window
    const durationDays = (params.endsAt.getTime() - params.startsAt.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > 90) {
        throw new Error('Boost duration cannot exceed 90 days');
    }

    // 2. Conflict Prevention
    if (params.scope === 'LISTING') {
        const overlaps = await prisma.boostRule.findFirst({
            where: {
                scope: 'LISTING',
                targetId: params.targetId,
                isActive: true,
                startsAt: { lte: params.endsAt },
                endsAt: { gte: params.startsAt }
            }
        });

        if (overlaps) {
            throw new Error('Conflict: Active listing overlap exists');
        }
    }

    const rule = await prisma.boostRule.create({
        data: params
    });

    await prisma.financeAuditLog.create({
        data: {
            tenantId: params.createdByTenantId,
            actor: 'PLATFORM_ADMIN',
            action: 'CREATED_BOOST_RULE' as any,
            entityId: rule.id,
            entityType: 'BoostRule',
            payloadJson: params as any
        }
    });

    return rule;
}

export async function deactivateBoostRule(ruleId: string, actorTenantId: string) {
    const updated = await prisma.boostRule.update({
        where: { id: ruleId },
        data: { isActive: false }
    });

    await prisma.financeAuditLog.create({
        data: {
            tenantId: actorTenantId,
            actor: 'PLATFORM_ADMIN',
            action: 'DEACTIVATED_BOOST_RULE' as any,
            entityId: ruleId,
            entityType: 'BoostRule',
            payloadJson: { deactivatedAt: new Date().toISOString() }
        }
    });

    return updated;
}
