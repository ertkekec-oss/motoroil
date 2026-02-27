import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const blocked = searchParams.get('blocked');
        const tenantId = searchParams.get('tenantId');
        const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);

        const where: any = {};
        if (status) where.status = status;
        if (blocked) where.billingBlocked = blocked === 'true';
        if (tenantId) where.tenantId = tenantId;

        const subs = await prisma.boostSubscription.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take,
            include: { invoices: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        // Use BoostTenantEnforcement? We just return the rules here
        return NextResponse.json({
            items: subs.map(sub => ({
                subscriptionId: sub.id,
                tenantId: sub.tenantId,
                status: sub.status,
                billingBlocked: sub.billingBlocked,
                quotaTotal: sub.quotaTotal,
                quotaUsed: sub.quotaUsed,
                renewsAt: sub.renewsAt,
                lastInvoiceStatus: sub.invoices.length > 0 ? sub.invoices[0].collectionStatus : null,
                trustTier: 'A' // or fetch from SellerTrustScore
            }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
