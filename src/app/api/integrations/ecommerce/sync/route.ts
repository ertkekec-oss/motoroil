import { NextResponse } from 'next/server';
import { EcommerceService } from '@/services/ecommerce';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // Resolve companyId
        let companyId = session.companyId;
        if (!companyId) {
            const company = await prisma.company.findFirst({
                where: { tenantId: session.tenantId }
            });
            companyId = company?.id;
        }

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma yetkisi bulunamadı.' }, { status: 401 });
        }

        const service = new EcommerceService();
        const orders = await service.fetchOrders();

        // Ensure E-ticaret category exists
        let categoryId: string | null = null;
        try {
            const ecommerceCategory = await prisma.customerCategory.upsert({
                where: { companyId_name: { companyId, name: 'E-ticaret' } },
                create: { companyId, name: 'E-ticaret', description: 'Web Satış Kanalı' },
                update: {}
            });
            categoryId = ecommerceCategory.id;
        } catch (catErr: any) {
            console.error('[E-COMMERCE] Category Upsert Error:', catErr.message);
        }

        let savedCount = 0;
        let errors: any[] = [];

        for (const order of orders) {
            try {
                // 1. Customer Sync
                const customerEmail = order.customerEmail || `guest-${order.orderId}@motoroil.com.tr`;
                const customer = await prisma.customer.upsert({
                    where: { email_companyId: { email: customerEmail, companyId } },
                    create: {
                        companyId,
                        name: order.customerName || 'E-Ticaret Müşterisi',
                        email: customerEmail,
                        categoryId: categoryId
                    },
                    update: {
                        categoryId: categoryId // Force e-commerce category
                    }
                });

                const existingOrder = await prisma.order.findUnique({
                    where: { companyId_orderNumber: { companyId, orderNumber: order.orderId } }
                });

                if (!existingOrder) {
                    await prisma.order.create({
                        data: {
                            companyId,
                            marketplace: 'MotorOil',
                            marketplaceId: order.orderId,
                            orderNumber: order.orderId,
                            customerName: customer.name,
                            customerEmail: customer.email,
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
