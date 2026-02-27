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

        let policy = await prisma.boostPolicyConfig.findUnique({ where: { id: 'GLOBAL' } });
        if (!policy) {
            policy = await prisma.boostPolicyConfig.create({
                data: {
                    id: 'GLOBAL',
                    multiplierMin: 1.0,
                    multiplierMax: 3.0,
                    sponsoredInventoryCapPct: 20,
                    interleavePatternJson: { "sponsoredEvery": 5 },
                    graceDays: 5,
                    maxRuleDurationDays: 90,
                    cTierBoostAllowed: true,
                    dTierBoostAllowed: false
                }
            });
        }

        return NextResponse.json({ policy });
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
        const { sponsoredInventoryCapPct, multiplierMin, multiplierMax, graceDays, interleavePatternJson, cTierBoostAllowed, dTierBoostAllowed, maxRuleDurationDays, reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            return await prisma.$transaction(async (tx) => {
                const policy = await tx.boostPolicyConfig.upsert({
                    where: { id: 'GLOBAL' },
                    update: {
                        sponsoredInventoryCapPct,
                        multiplierMin,
                        multiplierMax,
                        graceDays,
                        interleavePatternJson,
                        cTierBoostAllowed,
                        dTierBoostAllowed,
                        maxRuleDurationDays,
                        updatedAt: new Date()
                    },
                    create: {
                        id: 'GLOBAL',
                        sponsoredInventoryCapPct,
                        multiplierMin,
                        multiplierMax,
                        graceDays,
                        interleavePatternJson,
                        cTierBoostAllowed,
                        dTierBoostAllowed,
                        maxRuleDurationDays
                    }
                });

                await tx.financeAuditLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'UPDATE_BOOST_POLICY',
                        actor: session.id || 'SYSTEM',
                        entityId: 'GLOBAL',
                        entityType: 'BoostPolicyConfig',
                        payloadJson: { reason, ...body }
                    }
                });

                return policy;
            });
        });

        return NextResponse.json({ success: true, policy: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
