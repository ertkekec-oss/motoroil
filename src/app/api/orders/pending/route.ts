import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user;

        // Find current company for the tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: true, count: 0, orders: [] });
        }

        // Son 24 saatteki "Yeni" veya "Hazırlanıyor" statüsündeki siparişleri çek
        // Not: Pazaryerine göre statü isimleri değişebilir (Created, Picking vb.)
        // Son siparişleri çek (Statü farketmeksizin hepsini getir ki entegrasyonu görelim)
        const pendingOrders = await prisma.order.findMany({
            where: {
                companyId: company.id,
                marketplace: { not: 'POS' } // POS satışları 'Mağaza Satışları' sekmesinde, burası E-Ticaret
            },
            orderBy: {
                orderDate: 'desc'
            },
            take: 50
        });

        // Bildirim için sayı ve özet bilgi dön
        return NextResponse.json({
            success: true,
            count: pendingOrders.length,
            orders: pendingOrders
        });
    } catch (error: any) {
        console.error('Pending Orders Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
