import { NextResponse } from 'next/server';
import { MarketplaceServiceFactory } from '@/services/marketplaces';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { EventBus } from '@/services/fintech/event-bus';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    // Normalize session structure
    const sessionData = auth.user;
    const session: any = sessionData.user || sessionData;

    try {
        const body = await request.json();
        const { type, config } = body;

        // VERIFICATION LOG
        console.log(`[SYNC_START] User: ${session.username}, SessionCompanyId: ${session.companyId}, TenantId: ${session.tenantId}`);

        if (!type || !config) {
            return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 });
        }

        // 1. Company ID Resolution (Robust)
        let companyId = session.impersonateTenantId ? null : (session as any).companyId;
        let companyName = 'Unknown';

        // If impersonating or missing companyId, try to find a valid company
        if (!companyId) {
            const searchTenantId = session.impersonateTenantId || session.tenantId;
            console.log(`[MARKETPLACE] Resolving company for tenant: ${searchTenantId}`);

            // Fallback: Tenant's first company
            const company = await prisma.company.findFirst({
                where: { tenantId: searchTenantId }
            });

            if (company) {
                companyId = company.id;
                companyName = company.name;
                console.log(`[MARKETPLACE] Resolved companyId: ${companyId} (${companyName})`);
            } else if (session.role === 'SUPER_ADMIN' || session.tenantId === 'PLATFORM_ADMIN') {
                // Platform Admin fallback for the entire system if no specific tenant selected/found
                const fallbackCompany = await prisma.company.findFirst();
                if (fallbackCompany) {
                    companyId = fallbackCompany.id;
                    companyName = fallbackCompany.name;
                    console.log(`[MARKETPLACE] Platform Admin fallback to: ${companyId} (${companyName})`);
                }
            }
        } else {
            companyName = 'SessionCompany';
        }

        // CRITICAL GUARD
        if (!companyId) {
            console.error(`[MARKETPLACE] CRITICAL: Company ID missing! User: ${session.username}, Tenant: ${session.tenantId}`);
            return NextResponse.json({ success: false, error: "COMPANY_ID_MISSING: Firma yetkisi doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yapın." }, { status: 401 });
        }

        console.log(`[MARKETPLACE] Syncing for ${type} (Company: ${companyName}, ID: ${companyId})`);
        const service = MarketplaceServiceFactory.createService(type as any, config);

        // Fetch settings
        const daysToSync = typeof config.days === 'number' ? config.days : 3;
        const processLimit = typeof config.limit === 'number' ? config.limit : 50;
        const syncBranch = config.branch || 'Merkez';

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToSync);

        console.log(`[MARKETPLACE] Fetching orders from ${startDate.toISOString()}...`);
        const t0 = Date.now();
        const allOrders = await service.getOrders(startDate, endDate);
        console.log(`[MARKETPLACE] Fetched ${allOrders.length} orders in ${Date.now() - t0}ms`);

        // Slice for Vercel timeout
        const orders = allOrders.slice(0, processLimit);

        // SAFE UPSERT WRAPPER for Category
        let categoryId: string | null = null;
        try {
            console.log(`[UPSERT_DEBUG] Upserting Category for Company: ${companyId}`);
            // Schema update: CustomerCategory is now global (unique by name), no companyId
            const ecommerceCategory = await prisma.customerCategory.upsert({
                where: {
                    name: 'E-ticaret'
                },
                create: {
                    name: 'E-ticaret',
                    description: 'Web Satış Kanalı'
                },
                update: {}
            });
            categoryId = ecommerceCategory.id;
        } catch (catErr: any) {
            console.error(`[UPSERT_ERROR] Failed to ensure category: ${catErr.message}`);
            // Continue if possible, but customer creation might fail if category is required or logic depends on it.
            // However, customer creation below uses categoryId. We'll handle it there.
        }

        let savedCount = 0;
        let updatedCount = 0;
        let details: any[] = [];
        let errors: any[] = [];

        for (const order of orders) {
            try {
                // 1. Customer Sync
                let customer;
                const customerEmail = order.customerEmail || `guest-${order.orderNumber}@${type.toLowerCase()}.com`;

                try {
                    customer = await prisma.customer.upsert({
                        where: { email_companyId: { email: customerEmail, companyId: companyId } },
                        create: {
                            companyId: companyId,
                            name: order.customerName || 'Pazaryeri Müşterisi',
                            email: customerEmail,
                            phone: order.invoiceAddress?.phone || '',
                            address: JSON.stringify(order.invoiceAddress),
                            categoryId: categoryId
                        },
                        update: {}
                    });
                } catch (custErr: any) {
                    throw new Error(`Müşteri kaydı hatası: ${custErr.message}`);
                }

                // 2. Idempotency Guard
                const existingOrder = await prisma.order.findFirst({
                    where: { companyId, orderNumber: order.orderNumber }
                });

                if (!existingOrder) {
                    let newOrder;
                    try {
                        newOrder = await prisma.order.create({
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
                                shipmentPackageId: order.shipmentPackageId,
                                branch: syncBranch,
                                rawData: order as any
                            }
                        });
                    } catch (orderErr: any) {
                        throw new Error(`Sipariş oluşturma hatası: ${orderErr.message}`);
                    }

                    // TRIGGER REVENUE & FIFO
                    for (const item of (order.items || [])) {
                        try {
                            const productMap = await prisma.marketplaceProductMap.findUnique({
                                where: { marketplace_marketplaceCode: { marketplace: type, marketplaceCode: item.sku } }
                            });

                            await EventBus.emit({
                                companyId,
                                eventType: 'SALE_COMPLETED',
                                aggregateType: 'ORDER',
                                aggregateId: newOrder.id,
                                payload: {
                                    productId: productMap?.productId,
                                    marketplace: type,
                                    saleAmount: item.price * item.quantity,
                                    quantity: item.quantity,
                                    taxRate: item.taxRate || 20,
                                    sku: item.sku,
                                    orderNumber: order.orderNumber,
                                    branch: syncBranch
                                }
                            });
                        } catch (eventErr: any) {
                            console.error(`[SYNC_EVENT_ERROR] Order ${order.orderNumber} item ${item.sku}:`, eventErr.message);
                            // Event failure shouldn't rollback the order creation in this basic loop
                        }
                    }

                    savedCount++;
                    details.push({ order: order.orderNumber, action: 'Created' });
                } else {
                    const needsUpdate = existingOrder.status !== order.status || (order.shipmentPackageId && !existingOrder.shipmentPackageId);

                    if (needsUpdate) {
                        await prisma.order.update({
                            where: { id: existingOrder.id },
                            data: {
                                status: order.status,
                                shipmentPackageId: order.shipmentPackageId || existingOrder.shipmentPackageId
                            }
                        });

                        updatedCount++;
                        details.push({ order: order.orderNumber, action: 'StatusUpdate', status: order.status });
                    }
                }
            } catch (err: any) {
                console.error(`[SYNC_ERROR] Order ${order.orderNumber}:`, err.message);
                errors.push({ order: order.orderNumber, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `${orders.length} veri çekildi. ${savedCount} yeni, ${updatedCount} güncelleme. ${errors.length} hata.`,
            savedCount,
            updatedCount,
            errorCount: errors.length,
            details,
            errors
        });

    } catch (error: any) {
        console.error('Marketplace Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
