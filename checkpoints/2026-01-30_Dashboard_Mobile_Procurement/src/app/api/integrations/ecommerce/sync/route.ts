import { NextResponse } from 'next/server';
import { EcommerceService } from '@/services/ecommerce';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const service = new EcommerceService();
        const orders = await service.fetchOrders();

        let savedCount = 0;
        let errors: any[] = [];

        for (const order of orders) {
            try {
                const existingOrder = await prisma.order.findUnique({
                    where: { orderNumber: order.orderId }
                });

                if (!existingOrder) {
                    await prisma.order.create({
                        data: {
                            marketplace: 'MotorOil',
                            marketplaceId: order.orderId,
                            orderNumber: order.orderId,
                            customerName: order.customerName,
                            customerEmail: order.customerEmail,
                            totalAmount: order.totalAmount,
                            currency: 'TRY',
                            status: order.status || 'Yeni',
                            orderDate: new Date(order.orderDate),
                            items: order.items as any,
                            rawData: order as any
                        }
                    });
                    savedCount++;
                } else {
                    // Güncelle
                    await prisma.order.update({
                        where: { id: existingOrder.id },
                        data: {
                            status: order.status,
                            updatedAt: new Date()
                        }
                    });
                }
            } catch (err: any) {
                console.error(`E-Ticaret kayıt hatası (${order.orderId}):`, err);
                errors.push({ id: order.orderId, error: err.message, stack: err.stack });
            }
        }

        return NextResponse.json({
            success: true,
            count: savedCount,
            totalFound: orders.length,
            message: `${orders.length} sipariş bulundu, ${savedCount} yeni kayıt eklendi.`,
            debug: errors.length > 0 ? errors : 'No Errors',
            orders: orders.slice(0, 3)
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Entegrasyon hatası', stack: error.stack },
            { status: 500 }
        );
    }
}
