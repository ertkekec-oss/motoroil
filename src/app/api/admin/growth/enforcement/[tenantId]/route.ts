import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, props: { params: Promise<{ tenantId: string }> }) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_RISK_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN';

        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const body = await request.json();
        const { boostPaused, boostBanReason, quotaCapOverride, reason } = body;
        const params = await props.params;
        const tenantId = params.tenantId;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            return await prisma.$transaction(async (tx) => {
                const enf = await tx.boostTenantEnforcement.upsert({
                    where: { tenantId },
                    update: {
                        boostPaused: boostPaused !== undefined ? boostPaused : undefined,
                        boostBanReason: boostBanReason !== undefined ? boostBanReason : undefined,
                        quotaCapOverride: quotaCapOverride !== undefined ? quotaCapOverride : undefined,
                        updatedAt: new Date()
                    },
                    create: {
                        tenantId,
                        boostPaused: boostPaused || false,
                        boostBanReason: boostBanReason || null,
                        quotaCapOverride: quotaCapOverride || null
                    }
                });

                // Support legacy Boost paused sync if applicable. For brevity we just log.
                await tx.financeOpsLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'UPDATE_TENANT_ENFORCEMENT',
                        actor: session.id || 'SYSTEM',
                        payloadJson: { tenantId, boostPaused, boostBanReason, quotaCapOverride, reason }
                    }
                });

                return enf;
            });
        });

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
