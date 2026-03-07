import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectEscrowForAdmin } from '@/services/escrow/escrowProjection';

export async function GET(request: NextRequest) {
    const user = await getSession();
    // Verify admin logic

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (status) where.status = status;
    if (tenantId) {
        where.OR = [
            { buyerTenantId: tenantId },
            { sellerTenantId: tenantId }
        ];
    }

    try {
        const escrows = await prisma.networkEscrowHold.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            data: escrows.map(projectEscrowForAdmin)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
