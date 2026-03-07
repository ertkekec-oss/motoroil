import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { listEscrowsForTenant } from '@/services/escrow/escrowService';
import { projectEscrowForTenant } from '@/services/escrow/escrowProjection';

export async function GET(request: NextRequest) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const escrows = await listEscrowsForTenant(user.companyId);
        return NextResponse.json({ data: escrows.map(projectEscrowForTenant) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
