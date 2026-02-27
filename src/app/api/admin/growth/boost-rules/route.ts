import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

function isGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const targetType = searchParams.get('targetType');
        const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);

        const where: any = {};
        if (status) where.status = status;
        if (targetType) where.targetType = targetType;

        const rules = await prisma.boostRule.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take
        });

        // Use BoostTenantEnforcement? We just return the rules here
        return NextResponse.json({ rules });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const body = await request.json();
        const { targetType, targetId, multiplier, priority, maxImpressionsPerDay, startsAt, endsAt, reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 });
        if (!endsAt) return NextResponse.json({ error: 'endsAt is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const policy = await prisma.boostPolicyConfig.findUnique({ where: { id: 'GLOBAL' } }) || { maxRuleDurationDays: 90, multiplierMin: 1.0, multiplierMax: 3.0 };

            const sDate = new Date(startsAt);
            const eDate = new Date(endsAt);
            const diffDays = (eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24);

            if (diffDays > Number(policy.maxRuleDurationDays)) {
                throw new Error(`Duration exceeds max of ${policy.maxRuleDurationDays} days`);
            }
            if (multiplier < Number(policy.multiplierMin) || multiplier > Number(policy.multiplierMax)) {
                throw new Error(`Multiplier out of range`);
            }

            // Overlap guard
            const overlaps = await prisma.boostRule.findMany({
                where: {
                    targetType,
                    targetId: targetId || null,
                    status: { in: ['ACTIVE', 'SCHEDULED'] },
                    OR: [
                        { startsAt: { lte: eDate }, endsAt: { gte: sDate } }
                    ]
                }
            });

            if (overlaps.length > 0) {
                throw new Error('Overlap detected with another active rule for this target.');
            }

            const status = sDate <= new Date() ? 'ACTIVE' : 'SCHEDULED';

            return await prisma.$transaction(async (tx) => {
                const rule = await tx.boostRule.create({
                    data: {
                        scope: targetType === 'GLOBAL' ? 'GLOBAL' : (targetType as any),
                        targetType,
                        targetId: targetId || null,
                        multiplier,
                        priority: priority || 0,
                        maxImpressionsPerDay,
                        startsAt: sDate,
                        endsAt: eDate,
                        status
                    }
                });

                // Ops log
                await tx.financeOpsLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'CREATE_BOOST_RULE',
                        actor: session.id || 'SYSTEM',
                        payloadJson: { ruleId: rule.id, targetType, targetId, multiplier, reason }
                    }
                });

                return rule;
            });
        });

        return NextResponse.json({ success: true, rule: result });
    } catch (e: any) {
        // Return 409 for conflict
        const status = e.message.includes('Overlap') ? 409 : 500;
        return NextResponse.json({ error: e.message }, { status });
    }
}
