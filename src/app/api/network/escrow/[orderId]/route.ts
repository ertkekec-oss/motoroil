import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getEscrowDetails } from '@/services/escrow/escrowService';
import { projectEscrowForTenant } from '@/services/escrow/escrowProjection';

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const escrow = await getEscrowDetails(params.orderId);

        // Tenant authorization check
        if (escrow.buyerTenantId !== user.companyId && escrow.sellerTenantId !== user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ data: projectEscrowForTenant(escrow) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}
