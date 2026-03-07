import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Ensure user is an admin
        if (session.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const buyerTenantId = searchParams.get('buyerTenantId') || undefined;
        const supplierTenantId = searchParams.get('supplierTenantId') || undefined;

        const whereClause: any = {};
        if (buyerTenantId) whereClause.buyerTenantId = buyerTenantId;
        if (supplierTenantId) whereClause.supplierTenantId = supplierTenantId;

        const scores = await prisma.networkSupplierScore.findMany({
            where: whereClause,
            include: { supplierProfile: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json({ success: true, scores });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
