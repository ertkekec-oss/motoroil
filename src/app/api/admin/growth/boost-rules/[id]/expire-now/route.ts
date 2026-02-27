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

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const body = await request.json();
        const { reason } = body;
        const params = await props.params;
        const id = params.id;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const rule = await prisma.boostRule.findUnique({ where: { id } });
            if (!rule) throw new Error('Rule not found');
            if (rule.status === 'EXPIRED') throw new Error('Rule is already expired');

            return await prisma.$transaction(async (tx) => {
                const newRule = await tx.boostRule.update({
                    where: { id },
                    data: {
                        status: 'EXPIRED',
                        endsAt: new Date()
                    }
                });

                await tx.financeOpsLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'EXPIRE_BOOST_RULE',
                        actor: session.id || 'SYSTEM',
                        payloadJson: { ruleId: id, reason }
                    }
                });

                return newRule;
            });
        });

        return NextResponse.json({ success: true, rule: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
