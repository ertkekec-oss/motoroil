import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Son 24 saatteki "Yeni" veya "Hazırlanıyor" statüsündeki siparişleri çek
        // Not: Pazaryerine göre statü isimleri değişebilir (Created, Picking vb.)
        // Son siparişleri çek (Statü farketmeksizin hepsini getir ki entegrasyonu görelim)
        const pendingOrders = await prisma.order.findMany({
            where: {
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
