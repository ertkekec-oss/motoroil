import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        const role = session?.role?.toUpperCase() || '';
        const isAuth = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_FINANCE_ADMIN', 'PLATFORM_RISK_ADMIN', 'PLATFORM_GROWTH_ADMIN'].includes(role) || session?.tenantId === 'PLATFORM_ADMIN';

        if (!isAuth) return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const metric = searchParams.get('metric') || 'gmv';
        const range = searchParams.get('range') || '30d';

        let days = 30;
        if (range === '7d') days = 7;

        const now = new Date();
        const start = new Date(now.getTime() - days * 24 * 3600 * 1000);
        const dAsString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const metrics = await (prisma as any).platformDailyMetrics?.findMany({
            where: { day: { gte: dAsString(start) } },
            orderBy: { day: 'asc' }
        }) || [];

        const labels: string[] = [];
        const values: number[] = [];

        metrics.forEach((m: any) => {
            labels.push(m.day);
            if (metric === 'gmv') values.push(Number(m.gmvGross || 0));
            else if (metric === 'take') values.push(Number(m.takeRevenueCommission || 0) + Number(m.takeRevenueBoost || 0));
            else if (metric === 'escrow') values.push(Number(m.escrowFloatEndOfDay || 0));
            else if (metric === 'boostRevenue') values.push(Number(m.takeRevenueBoost || 0));
            else values.push(0);
        });

        return NextResponse.json({ labels, values });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
