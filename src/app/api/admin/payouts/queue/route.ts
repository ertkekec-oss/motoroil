import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isPayoutAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || role === 'PLATFORM_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPayoutAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'ALL';

        const where: any = {};
        if (status !== 'ALL') {
            where.status = status;
        }

        const requests = await prisma.payoutRequest.findMany({
            where,
            orderBy: { requestedAt: 'desc' },
            take: 100,
            include: { destination: true } // Include destination info
        });

        // Compute KPIs for header
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [reqCount, procCount, failedCount, sumProcessed] = await Promise.all([
            prisma.payoutRequest.count({ where: { status: 'REQUESTED' } }),
            prisma.payoutRequest.count({ where: { status: 'PROCESSING' } }),
            prisma.payoutRequest.count({ where: { status: 'FAILED' } }),
            prisma.payoutRequest.aggregate({
                _sum: { amount: true },
                where: { status: 'PAID_INTERNAL', processedAt: { gte: startOfDay } }
            })
        ]);

        return NextResponse.json({
            items: requests,
            kpis: {
                requested: reqCount,
                processing: procCount,
                failed: failedCount,
                processedToday: Number(sumProcessed._sum.amount || 0)
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
