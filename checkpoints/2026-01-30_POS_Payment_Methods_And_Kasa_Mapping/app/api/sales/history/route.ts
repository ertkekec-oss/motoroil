
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source'); // 'POS', 'ONLINE', or null (all)
        const limit = parseInt(searchParams.get('limit') || '50');

        let whereClause: any = {};

        if (source === 'POS') {
            whereClause.marketplace = 'POS';
            // POS satışlarında özel bir statü dayatması yapmıyoruz, her şeyi gösterelim.
        } else if (source === 'ONLINE') {
            whereClause.marketplace = {
                not: 'POS'
            };
            whereClause.status = {
                in: ['Tamamlandı', 'Faturalandırıldı', 'Delivered', 'Kargolandı']
            };
        } else {
            // Varsayılan
            whereClause.status = {
                in: ['Tamamlandı', 'Faturalandırıldı', 'Delivered', 'Kargolandı']
            };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            orderBy: {
                orderDate: 'desc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            orders
        });

    } catch (error: any) {
        console.error('Sales History Error:', error);
        return NextResponse.json(
            { success: false, error: 'Satış geçmişi alınamadı.' },
            { status: 500 }
        );
    }
}
