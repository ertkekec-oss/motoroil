import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = ['SUPER_ADMIN', 'PLATFORM_FINANCE_ADMIN', 'PLATFORM_ADMIN'].includes(role) || session?.tenantId === 'PLATFORM_ADMIN';
        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const body = await request.json();
        const { reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 5) return NextResponse.json({ error: 'Reddetme sebebi zorunludur' }, { status: 400 });

        const payoutId = params.id;

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const req = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
            if (!req) throw new Error('Payout request not found');
            if (!['REQUESTED', 'APPROVED'].includes(req.status)) throw new Error(`Cannot reject, status is ${req.status}`);

            // Transition REJECTED, returning funds to Escrow / Balance
            // In a real flow, this triggers Kasa re-credits.
            const updated = await prisma.payoutRequest.update({
                where: { id: payoutId },
                data: {
                    status: 'REJECTED',
                    failureMessage: reason,
                    note: `Reddedildi: ${reason}`
                }
            });

            // Log mutation
            await prisma.financeOpsLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'REJECT_PAYOUT_REQUEST',
                    actor: session.id || 'SYSTEM',
                    payloadJson: { payoutId, amount: req.amount, reason }
                }
            });

            return updated;
        });

        return NextResponse.json({ success: true, item: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
