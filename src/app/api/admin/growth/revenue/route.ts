import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        // Ideally reads from PlatformDailyMetrics.takeRevenueBoost
        // For now, since PlatformDailyMetrics isn't exposed or modeled explicitly in this snippet
        // We will mock the charts payload based on BoostInvoice payments (e.g., status PAID)

        const paidBoosts = await prisma.boostInvoice.findMany({
            where: { status: 'PAID' },
            select: { amountDue: true, createdAt: true, dueDate: true }
        });

        let totalBoostRev = 0;
        paidBoosts.forEach(b => {
            totalBoostRev += Number(b.amountDue);
        });

        // Mock chart points
        const mockTrend = [
            { date: 'Bugün-3', revenue: totalBoostRev * 0.2, impressions: 14000 },
            { date: 'Bugün-2', revenue: totalBoostRev * 0.3, impressions: 15500 },
            { date: 'Bugün-1', revenue: totalBoostRev * 0.4, impressions: 22000 },
            { date: 'Bugün', revenue: totalBoostRev * 0.1, impressions: 8000 }
        ];

        return NextResponse.json({
            totalBoostRev,
            takeRate: '4.2%', // Mocked indicator
            chartData: mockTrend
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
