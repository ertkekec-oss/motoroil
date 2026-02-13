import { NextResponse } from 'next/server';
import { MarketplaceServiceFactory } from '@/services/marketplaces';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { EventBus } from '@/services/fintech/event-bus';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const body = await request.json();
        const { type, config } = body;

        if (!type || !config) {
            return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 });
        }

        // 0. Tenant Isolation - Find Active Company
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });
        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma yetkisi bulunamadı' }, { status: 403 });
        }
        const companyId = company.id;

        console.log(`[MARKETPLACE] Syncing for ${type} (Company: ${company.name})`);
        const service = MarketplaceServiceFactory.createService(type as any, config);

        // Fetch last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const orders = await service.getOrders(startDate, endDate);

        // Ensure E-commerce Category
        const ecommerceCategory = await prisma.customerCategory.upsert({
            where: { name: 'E-ticaret' },
            create: { name: 'E-ticaret', description: 'Web Satış Kanalı' },
            update: {}
        });

        let savedCount = 0;
        let updatedCount = 0;
        let details: any[] = [];

        for (const order of orders) {
            try {
                // 1. Customer Sync
                const customer = await prisma.customer.upsert({
                    where: { email_companyId: { email: order.customerEmail || `guest-${order.orderNumber}@${type}.com`, companyId } },
                    create: {
                        companyId,
                        name: order.customerName || 'Pazaryeri Müşterisi',
                        email: order.customerEmail,
                        phone: order.invoiceAddress?.phone || '',
                        address: JSON.stringify(order.invoiceAddress),
                        categoryId: ecommerceCategory.id
                    },
                    update: {}
                });

                // 2. Idempotency Guard (Composite Unique)
                const existingOrder = await prisma.order.findUnique({
                    where: { companyId_orderNumber: { companyId, orderNumber: order.orderNumber } }
                });

                if (!existingOrder) {
                    // NEW ORDER: CREATE & EMIT SALE
                    const newOrder = await prisma.order.create({
                        data: {
                            companyId,
                            marketplace: type,
                            marketplaceId: order.id,
                            orderNumber: order.orderNumber,
                            customerName: customer.name,
                            totalAmount: order.totalAmount,
                            currency: order.currency || 'TRY',
                            status: order.status,
                            orderDate: new Date(order.orderDate),
                            items: order.items as any,
                            shippingAddress: order.shippingAddress as any,
                            invoiceAddress: order.invoiceAddress as any,
                            shipmentPackageId: order.shipmentPackageId, // CRITICAL: For Trendyol ops
                            rawData: order as any
                        }
                    });

                    // TRIGGER REVENUE & FIFO PER ITEM
                    for (const item of (order.items || [])) {
                        // Find ERP Product ID
                        const productMap = await prisma.marketplaceProductMap.findUnique({
                            where: { marketplace_marketplaceCode: { marketplace: type, marketplaceCode: item.sku } }
                        });

                        // Emit Sale Event
                        await EventBus.emit({
                            companyId,
                            eventType: 'SALE_COMPLETED',
                            aggregateType: 'ORDER',
                            aggregateId: newOrder.id,
                            payload: {
                                productId: productMap?.productId, // If null, FIFO is skipped but accounting continues
                                marketplace: type,
                                saleAmount: item.price * item.quantity,
                                quantity: item.quantity,
                                taxRate: item.taxRate || 20, // Dynamic VAT Support
                                sku: item.sku,
                                orderNumber: order.orderNumber
                            }
                        });
                    }

                    savedCount++;
                    details.push({ order: order.orderNumber, action: 'Created' });
                } else {
                    // UPDATE HANDLING (Status Reversals + Missing Data Patching)
                    const needsUpdate = existingOrder.status !== order.status || (order.shipmentPackageId && !existingOrder.shipmentPackageId);

                    if (needsUpdate) {
                        await prisma.order.update({
                            where: { id: existingOrder.id },
                            data: {
                                status: order.status,
                                shipmentPackageId: order.shipmentPackageId || existingOrder.shipmentPackageId
                            }
                        });

                        if (['CANCELLED', 'RETURNED'].includes(order.status.toUpperCase())) {
                            // TODO: Add REFUND_COMPLETED event to reverse FIFO/Rev
                            console.log(`[MARKETPLACE] Order ${order.orderNumber} ${order.status}. Reversal pending.`);
                        }

                        updatedCount++;
                        details.push({ order: order.orderNumber, action: 'StatusUpdate', status: order.status });
                    }
                }
            } catch (err: any) {
                console.error(`[SYNC_ERROR] Order ${order.orderNumber}:`, err.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: `${orders.length} veri çekildi. ${savedCount} yeni, ${updatedCount} güncelleme.`,
            savedCount,
            updatedCount,
            details
        });

    } catch (error: any) {
        console.error('Marketplace Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
