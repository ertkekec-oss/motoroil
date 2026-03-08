import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getEscrowDetails } from '@/services/escrow/escrowService';
import { transitionEscrowState } from '@/services/escrow/escrowStateMachine';

export async function POST(request: NextRequest, props: { params: Promise<{ orderId: string }> }) {
    const params = await props.params;
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const escrow = await getEscrowDetails(params.orderId);

        // This is a naive implementation; proper refund typically requires Admin/Dispute phase first.
        if (escrow.buyerTenantId !== user.companyId) {
            return NextResponse.json({ error: 'Only buyer can request refund' }, { status: 403 });
        }

        if (['RELEASED', 'REFUNDED', 'CANCELED'].includes(escrow.status)) {
            return NextResponse.json({ error: `Cannot refund from state ${escrow.status}` }, { status: 400 });
        }

        // We push it to DISPUTED to block release.
        await transitionEscrowState(
            escrow.id,
            'DISPUTED',
            'DISPUTE_OPENED',
            { source: 'BUYER_REFUND_REQUEST', sourceId: user.id }
        );

        return NextResponse.json({ success: true, message: 'Dispute opened and money locked' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
