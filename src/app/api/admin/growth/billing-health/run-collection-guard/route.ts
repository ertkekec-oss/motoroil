import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN';

        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const body = await request.json();
        const { reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            // In reality, this would trigger the BullMQ worker for `processEscalationPolicies`
            // For this API simulate a basic collection guard run by transitioning invoices.
            const openInvoices = await prisma.boostInvoice.findMany({
                where: { status: 'ISSUED', collectionStatus: { not: 'COLLECTION_BLOCKED' } },
                include: { subscription: true }
            });

            let countOverdue = 0;
            let countBlocked = 0;
            const now = new Date();

            for (const inv of openInvoices) {
                if (!inv.dueDate) continue;

                const daysOverdue = (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24);

                // If > 0 but < 5: GRACE
                // If >= 5 but < 15: OVERDUE
                // If >= 15: COLLECTION_BLOCKED // and sub gets paused

                if (daysOverdue >= 15 && inv.collectionStatus !== 'COLLECTION_BLOCKED') {
                    await prisma.$transaction(async (tx) => {
                        await tx.boostInvoice.update({ where: { id: inv.id }, data: { collectionStatus: 'COLLECTION_BLOCKED' } });
                        if (!inv.subscription.billingBlocked) {
                            await tx.boostSubscription.update({ where: { id: inv.subscriptionId }, data: { billingBlocked: true, status: 'PAUSED' } });
                        }
                    });
                    countBlocked++;
                } else if (daysOverdue >= 5 && daysOverdue < 15 && inv.collectionStatus !== 'OVERDUE') {
                    await prisma.boostInvoice.update({ where: { id: inv.id }, data: { collectionStatus: 'OVERDUE' } });
                    countOverdue++;
                } else if (daysOverdue > 0 && daysOverdue < 5 && inv.collectionStatus !== 'GRACE') {
                    await prisma.boostInvoice.update({ where: { id: inv.id }, data: { collectionStatus: 'GRACE' } });
                }
            }

            await prisma.financeOpsLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'RUN_COLLECTION_GUARD',
                    actor: session.id || 'SYSTEM',
                    payloadJson: { reason, countOverdue, countBlocked }
                }
            });

            return { countOverdue, countBlocked };
        });

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
