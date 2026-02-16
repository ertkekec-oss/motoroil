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

        // 2. Initial Date Logic (30 days fallback)
        const marketplaceConfig = await prisma.marketplaceConfig.findUnique({
            where: {
                companyId_type: {
                    companyId: companyId,
                    type: type.toLowerCase().trim()
                }
            }
        });

        const syncBranch = config.branch || 'Merkez';
        const daysToSync = typeof config.days === 'number' ? config.days : 3;
        const processLimit = typeof config.limit === 'number' ? config.limit : 50;

        const endDate = new Date();
        let startDate = new Date();

        if (marketplaceConfig?.lastSync) {
            // If already synced, just sync from last sync minus a buffer (1 hour)
            startDate = new Date(marketplaceConfig.lastSync.getTime() - (60 * 60 * 1000));
        } else {
            // First time sync: 90 days back per user request for production-ready sync
            startDate.setDate(startDate.getDate() - 90);
            console.log(`[MARKETPLACE] Initial sync detected, going back 90 days.`);
        }

        const service = MarketplaceServiceFactory.createService(type as any, { ...config, branch: syncBranch });

        console.log(`[MARKETPLACE] Fetching orders from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
        let allOrders: any[] = [];
        try {
            const t0 = Date.now();
            allOrders = await service.getOrders(startDate, endDate);
            console.log(`[MARKETPLACE] Fetched ${allOrders.length} orders in ${Date.now() - t0}ms`);
        } catch (remoteErr: any) {
            console.error(`[MARKETPLACE_REMOTE_ERROR] ${type}:`, remoteErr.message);
            // Return 400 with remote error details instead of 500
            const statusCode = remoteErr.message.includes('400') ? 400 : (remoteErr.message.includes('401') ? 401 : 400);
            return NextResponse.json({
                success: false,
                error: remoteErr.message,
                remoteStatus: statusCode,
                advice: "Lütfen API anahtarlarınızı ve Hepsiburada panelindeki OMS yetkilerini kontrol edin."
            }, { status: statusCode });
        }

        // Slice for Vercel timeout
        const orders = allOrders.slice(0, processLimit);

        // SAFE UPSERT WRAPPER for Category
        let categoryId: string | null = null;
        try {
            const ecommerceCategory = await prisma.customerCategory.upsert({
                where: { name: 'E-ticaret' },
                create: { name: 'E-ticaret', description: 'Web Satış Kanalı' },
                update: {}
            });
            categoryId = ecommerceCategory.id;
        } catch (catErr) { }

        let savedCount = 0;
        let updatedCount = 0;
        let details: any[] = [];
        let errors: any[] = [];

        for (const order of orders) {
            try {
                // 1. Customer Sync
                let customer;
                const customerEmail = order.customerEmail || `guest-${order.orderNumber}@${type.toLowerCase()}.com`;

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

                // 2. Idempotency Guard
                const existingOrder = await prisma.order.findFirst({
                    where: { companyId, orderNumber: order.orderNumber }
                });

                if (!existingOrder) {
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
                            shipmentPackageId: order.shipmentPackageId,
                            branch: syncBranch,
                            rawData: order as any
                        }
                    });

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
                        } catch (eventErr) { }
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
                errors.push({ order: order.orderNumber, error: err.message });
            }
        }

        // 3. Update Last Sync Time
        if (marketplaceConfig) {
            await prisma.marketplaceConfig.update({
                where: { id: marketplaceConfig.id },
                data: { lastSync: new Date() }
            });
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
