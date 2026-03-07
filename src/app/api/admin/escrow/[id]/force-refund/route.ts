import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { refundEscrowFunds } from '@/services/escrow/escrowLedger';
import { transitionEscrowState } from '@/services/escrow/escrowStateMachine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession();

    try {
        const hold = await prisma.networkEscrowHold.findUnique({ where: { id: params.id } });
        if (!hold) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (['REFUNDED', 'RELEASED'].includes(hold.status)) {
            return NextResponse.json({ error: `Cannot force refund from ${hold.status}` }, { status: 400 });
        }

        await refundEscrowFunds(hold.buyerTenantId, hold.sellerTenantId, hold.orderId, hold.amount);

        await transitionEscrowState(hold.id, 'REFUNDED', 'ESCROW_REFUNDED', { source: 'ADMIN_FORCE' });

        await prisma.networkEscrowHold.update({
            where: { id: hold.id },
            data: { refundedAt: new Date() }
        });

        return NextResponse.json({ success: true, message: 'Force refunded' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
