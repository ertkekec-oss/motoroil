
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user.user || auth.user;

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        // Active visits — include location data for map
        const activeVisits = await (prisma as any).salesVisit.findMany({
            where: { companyId: company.id, checkOutTime: null },
            include: {
                customer: {
                    select: {
                        name: true, district: true, city: true, address: true,
                        lat: true, lng: true   // customer coordinates if stored
                    }
                },
                staff: { select: { name: true, phone: true } }
            },
            orderBy: { checkInTime: 'desc' }
        });

        // Recent visits (last 24h) — include checkout location for map trails
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentVisits = await (prisma as any).salesVisit.findMany({
            where: {
                companyId: company.id,
                checkInTime: { gte: dayAgo },
                NOT: { checkOutTime: null }
            },
            include: {
                customer: { select: { name: true, lat: true, lng: true, city: true, district: true } },
                staff: { select: { name: true } },
                orders: { select: { totalAmount: true } },
                transactions: { select: { amount: true } }
            },
            orderBy: { checkOutTime: 'desc' },
            take: 30
        });

        // Today stats
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayVisitsCount = await (prisma as any).salesVisit.count({
            where: { companyId: company.id, checkInTime: { gte: startOfDay } }
        });

        const todayOrderTotal = await (prisma as any).salesVisit.findMany({
            where: { companyId: company.id, checkInTime: { gte: startOfDay } },
            include: { orders: { select: { totalAmount: true } } }
        });
        const totalRevenue = todayOrderTotal.reduce((sum: number, v: any) => {
            return sum + (v.orders || []).reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
        }, 0);

        // Enrich active visits with parsed location from checkInLocation JSON
        const enrichedActive = activeVisits.map((v: any) => {
            const loc = v.checkInLocation && typeof v.checkInLocation === 'object' ? v.checkInLocation : {};
            return {
                ...v,
                staffLat: loc.lat || null,
                staffLng: loc.lng || null,
                distanceMeters: loc.distanceMeters || null,
                isOutOfRange: v.isOutOfRange || false,
            };
        });

        return NextResponse.json({
            success: true,
            activeVisits: enrichedActive,
            recentVisits,
            stats: { todayVisitsCount, totalRevenue }
        });
    } catch (error: any) {
        console.error('Live status API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
