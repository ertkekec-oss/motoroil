
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user.user || auth.user;

        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        // Get active visits (those without checkOutTime)
        const activeVisits = await (prisma as any).salesVisit.findMany({
            where: {
                companyId: company.id,
                checkOutTime: null
            },
            include: {
                customer: { select: { name: true, district: true, city: true } },
                staff: { select: { name: true, phone: true } }
            },
            orderBy: { checkInTime: 'desc' }
        });

        // Get recent visits (last 24h)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentVisits = await (prisma as any).salesVisit.findMany({
            where: {
                companyId: company.id,
                checkInTime: { gte: dayAgo },
                NOT: { checkOutTime: null }
            },
            include: {
                customer: { select: { name: true } },
                staff: { select: { name: true } },
                orders: { select: { totalAmount: true } },
                transactions: { select: { amount: true } }
            },
            orderBy: { checkOutTime: 'desc' },
            take: 20
        });

        // Get total stats for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayVisitsCount = await (prisma as any).salesVisit.count({
            where: { companyId: company.id, checkInTime: { gte: startOfDay } }
        });

        return NextResponse.json({
            success: true,
            activeVisits,
            recentVisits,
            stats: {
                todayVisitsCount
            }
        });
    } catch (error: any) {
        console.error('Live status API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
