import { PrismaClient, BoostScope } from '@prisma/client';

const prisma = new PrismaClient();

export async function fetchActiveBoosts() {
    const now = new Date();
    return await prisma.boostRule.findMany({
        where: {
            isActive: true,
            startsAt: { lte: now },
            endsAt: { gte: now }
        }
    });
}

export async function createBoostRule(params: {
    scope: BoostScope;
    targetId: string;
    multiplier: number;
    startsAt: Date;
    endsAt: Date;
    createdByTenantId: string;
}) {
    if (params.multiplier <= 0 || params.multiplier > 5) {
        throw new Error('Boost multiplier must be between 0.1 and 5.0');
    }

    if (params.endsAt <= params.startsAt) {
        throw new Error('EndsAt must be after StartsAt');
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
