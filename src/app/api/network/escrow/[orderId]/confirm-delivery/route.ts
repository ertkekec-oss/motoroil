import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getEscrowDetails } from '@/services/escrow/escrowService';
import { transitionEscrowState } from '@/services/escrow/escrowStateMachine';
import { scheduleRelease } from '@/services/escrow/escrowReleaseEngine';

export async function POST(request: NextRequest, props: { params: Promise<{ orderId: string }> }) {
    const params = await props.params;
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const escrow = await getEscrowDetails(params.orderId);

        if (escrow.buyerTenantId !== user.companyId) {
            return NextResponse.json({ error: 'Only buyer can confirm delivery' }, { status: 403 });
        }

        if (escrow.status !== 'IN_TRANSIT' && escrow.status !== 'SHIPMENT_PENDING') {
            return NextResponse.json({ error: `Cannot confirm delivery from state ${escrow.status}` }, { status: 400 });
        }

        const updatedEscrow = await transitionEscrowState(
            escrow.id,
            'DELIVERY_CONFIRMED',
            'SHIPMENT_DELIVERED',
            { source: 'BUYER_CONFIRMATION', sourceId: user.id }
        );

        // Buyer confirmation usually forces instant release bypassing delay
        await scheduleRelease(updatedEscrow.id);

        return NextResponse.json({ success: true, message: 'Delivery confirmed and release scheduled' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
