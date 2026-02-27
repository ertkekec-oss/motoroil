import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN';

        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const body = await request.json();
        const { reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            // Calculate snapshot
            const allOpen = await prisma.boostInvoice.groupBy({
                by: ['collectionStatus'],
                where: { status: 'ISSUED' },
                _sum: { amountDue: true },
                _count: { id: true }
            });

            let outstandingArTotal = 0;
            let overdueCount = 0;
            let graceCount = 0;
            let blockedCount = 0;

            allOpen.forEach(g => {
                outstandingArTotal += Number(g._sum.amountDue || 0);
                if (g.collectionStatus === 'OVERDUE') overdueCount += g._count.id;
                if (g.collectionStatus === 'GRACE') graceCount += g._count.id;
                if (g.collectionStatus === 'COLLECTION_BLOCKED') blockedCount += g._count.id;
            });

            const d = new Date();
            const asOfDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            return await prisma.$transaction(async (tx) => {
                const snap = await tx.boostBillingHealthSnapshot.upsert({
                    where: { asOfDate },
                    update: {
                        outstandingArTotal,
                        overdueCount,
                        graceCount,
                        blockedSubscriptionsCount: blockedCount,
                        topOverdueTenantsJson: {} // simplified
                    },
                    create: {
                        asOfDate,
                        outstandingArTotal,
                        overdueCount,
                        graceCount,
                        blockedSubscriptionsCount: blockedCount,
                        topOverdueTenantsJson: {}
                    }
                });

                await tx.financeOpsLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: 'CREATE_BILLING_SNAPSHOT',
                        actor: session.id || 'SYSTEM',
                        payloadJson: { asOfDate, reason, outstandingArTotal }
                    }
                });

                return snap;
            });
        });

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
