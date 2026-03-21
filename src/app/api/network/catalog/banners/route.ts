import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get the supplier's tenantId. DealerMembership has supplierTenantId.
        const dealerMembershipId = session.user?.dealerMembershipId || (session as any).dealerMembershipId;
        
        let targetTenantId = '';

        if (dealerMembershipId) {
            const membership = await prisma.dealerMembership.findUnique({
                where: { id: dealerMembershipId }
            });
            if (membership) {
                targetTenantId = membership.supplierTenantId;
            }
        } 
        
        if (!targetTenantId) {
            const user = session.user || session;
            targetTenantId = session.tenantId || user.tenantId;
        }

        if (!targetTenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const banners = await prisma.networkBanner.findMany({
            where: { tenantId: targetTenantId, isActive: true },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json({ ok: true, banners });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
