import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

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

        // Resolve Company ID from session
        const authResult = await authorize();
        if (!authResult.authorized) return authResult.response;
        const user = authResult.user;

        if (!user.companyId) {
            return NextResponse.json({ success: true, orders: [] });
        }

        whereClause.companyId = user.companyId;

        const [orders, salesOrders] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                orderBy: {
                    orderDate: 'desc'
                },
                take: limit
            }),
            (prisma as any).salesOrder.findMany({
                where: {
                    // Filter field sales by company if whereClause has it, or just show last ones
                    companyId: whereClause.companyId
                },
                include: {
                    customer: { select: { name: true } },
                    items: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            })
        ]);

        // Normalize Orders
        const normalizedOrders = orders.map((o: any) => ({
            ...o,
            items: (Array.isArray(o.items) ? o.items : []).map((i: any) => ({
                name: i.name || i.productName || 'Ürün',
                qty: i.qty || i.quantity || 1,
                price: Number(i.price || i.unitPrice || 0)
            }))
        }));

        // Normalize SalesOrders to match Order structure
        const normalizedSalesOrders = salesOrders.map((so: any) => ({
            id: so.id,
            orderNumber: `SS-${so.id.substring(so.id.length - 6).toUpperCase()}`,
            marketplace: 'SAHA SATIŞ',
            customerName: so.customer?.name || 'Bilinmeyen',
            totalAmount: Number(so.totalAmount),
            status: so.status,
            orderDate: so.createdAt,
            items: so.items.map((i: any) => ({
                name: i.productName,
                qty: i.quantity,
                price: Number(i.unitPrice)
            })),
            sourceType: 'FIELD_SALE'
        }));

        const combined = [...normalizedOrders, ...normalizedSalesOrders]
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, limit);

        return NextResponse.json({
            success: true,
            orders: combined
        });

    } catch (error: any) {
        console.error('Sales History Error:', error);
        return NextResponse.json(
            { success: false, error: 'Satış geçmişi alınamadı.' },
            { status: 500 }
        );
    }
}
