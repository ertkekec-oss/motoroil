import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN';

        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const body = await request.json();
        const { reason } = body;
        const params = await props.params;
        const id = params.id;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const sub = await prisma.boostSubscription.findUnique({ where: { id } });
            if (!sub) throw new Error('Subscription not found');

            return await prisma.$transaction(async (tx) => {
                const updated = await tx.boostSubscription.update({
                    where: { id },
                    data: {
                        billingBlocked: false,
                        status: 'ACTIVE' // or maintain if was purely active
                    }
                });

                // Note: we might also want to set any OVERDUE invoices to a different status or 
                // assume they were handled. We just remove the blocked lock.

                await tx.financeOpsLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'UNBLOCK_SUBSCRIPTION',
                        actor: session.id || 'SYSTEM',
                        payloadJson: { subscriptionId: id, tenantId: sub.tenantId, reason }
                    }
                });

                return updated;
            });
        });

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
