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

        // VERIFY existence of companyId in current DB (handles stale sessions after DB reset)
        if (companyId) {
            const companyExists = await prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true }
            });
            if (!companyExists) {
                console.warn(`[MARKETPLACE] Session companyId ${companyId} NOT FOUND in DB. Attempting fallback...`);
                companyId = null;
            } else {
                companyName = companyExists.name;
            }
        }

        // If impersonating or missing/invalid companyId, try to find a valid company
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
            // Aggressive lookback: Go back 3 days (was 14) to catch delayed orders/cancellations without overloading
            startDate = new Date(marketplaceConfig.lastSync.getTime() - (3 * 24 * 60 * 60 * 1000));
        } else {
            // First time sync: 14 days back (was 90) to prevent timeouts
            startDate.setDate(startDate.getDate() - 14);
            console.log(`[MARKETPLACE] Initial sync detected, going back 14 days.`);
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
            let advice = "Lütfen API anahtarlarınızı ve entegrasyon ayarlarınızı kontrol edin.";
            if (type.toLowerCase() === 'hepsiburada') {
                advice = "Lütfen API anahtarlarınızı ve Hepsiburada panelindeki OMS yetkilerini kontrol edin.";
            } else if (type.toLowerCase() === 'trendyol') {
                advice = "Lütfen API anahtarlarınızı ve Trendyol Satıcı Paneli -> Hesap Bilgileri -> Entegrasyon Bilgileri alanını kontrol edin.";
            }

            return NextResponse.json({
                success: false,
                error: remoteErr.message,
                remoteStatus: statusCode,
                advice
            }, { status: statusCode });
        }

        // Slice for Vercel timeout
        const orders = allOrders.slice(0, processLimit);

        // SAFE UPSERT WRAPPER for Category
        let categoryId: string | null = null;
        try {
            const ecommerceCategory = await prisma.customerCategory.upsert({
                where: { companyId_name: { companyId, name: 'E-ticaret' } },
                create: { companyId, name: 'E-ticaret', description: 'Web Satış Kanalı' },
                update: {}
            });
            categoryId = ecommerceCategory.id;
        } catch (catErr: any) {
            console.error('[MARKETPLACE] Category Upsert Error:', catErr.message);
        }

        let savedCount = 0;
        let updatedCount = 0;
        const details: any[] = [];
        const errors: any[] = [];
        const asStringOrNull = (v: any) => (v === undefined || v === null || v === "") ? null : String(v);

        const typeToDisplay = (t: string) => {
            const k = t.toLowerCase();
            if (k === "n11") return "N11";
            if (k === "pos") return "POS";
            return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
        };

        for (const order of orders) {
            const orderNumber = asStringOrNull(order.orderNumber || order.id);
            const marketplaceId = asStringOrNull(order.id) || orderNumber;
            const shipmentPackageId = asStringOrNull(order.shipmentPackageId);
            const normalizedMarketplace = typeToDisplay(type);

            try {
                if (!orderNumber) throw new Error("Sipariş numarası bulunamadı (orderNumber/id eksik)");

                // 1. Customer Sync
                let customer;
                const customerEmail = order.customerEmail || `guest-${orderNumber}@${type.toLowerCase()}.com`;

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
                    update: {
                        categoryId: categoryId
                    }
                });

                // 2. Idempotency Guard (Company + Marketplace + OrderNumber)
                const existingOrder = await prisma.order.findFirst({
                    where: {
                        companyId,
                        orderNumber: orderNumber,
                        marketplace: normalizedMarketplace
                    }
                });

                if (!existingOrder) {
                    const newOrder = await prisma.order.create({
                        data: {
                            companyId,
                            marketplace: normalizedMarketplace,
                            marketplaceId: marketplaceId,
                            orderNumber: orderNumber,
                            customerName: customer.name,
                            totalAmount: Number(order.totalAmount || 0),
                            currency: order.currency || 'TRY',
                            status: order.status,
                            orderDate: new Date(order.orderDate),
                            items: order.items as any,
                            shippingAddress: order.shippingAddress as any,
                            invoiceAddress: order.invoiceAddress as any,
                            shipmentPackageId: shipmentPackageId,
                            branch: syncBranch,
                            rawData: order as any
                        }
                    });

                    // TRIGGER REVENUE & FIFO
                    for (const item of (order.items || [])) {
                        try {
                            const productMap = await prisma.marketplaceProductMap.findUnique({
                                where: {
                                    companyId_marketplace_marketplaceCode: {
                                        companyId,
                                        marketplace: type,
                                        marketplaceCode: item.sku
                                    }
                                }
                            });

                            await EventBus.emit({
                                companyId,
                                eventType: 'SALE_COMPLETED',
                                aggregateType: 'ORDER',
                                aggregateId: newOrder.id,
                                payload: {
                                    productId: productMap?.productId,
                                    marketplace: normalizedMarketplace,
                                    saleAmount: item.price * item.quantity,
                                    quantity: item.quantity,
                                    taxRate: item.taxRate || 20,
                                    sku: item.sku,
                                    orderNumber: orderNumber,
                                    branch: syncBranch
                                }
                            });
                        } catch (eventErr) { }
                    }

                    savedCount++;
                    details.push({ order: orderNumber, action: 'Created' });
                } else {
                    const dbItems = Array.isArray(existingOrder.items) ? existingOrder.items : [];
                    const normalizedTotal = Number(order.totalAmount || 0);
                    const needsUpdate = existingOrder.status !== order.status ||
                        (shipmentPackageId && !existingOrder.shipmentPackageId) ||
                        (dbItems.length === 0 && (order.items?.length || 0) > 0) ||
                        (Number(existingOrder.totalAmount || 0) === 0 && normalizedTotal > 0);

                    if (needsUpdate) {
                        await prisma.order.update({
                            where: { id: existingOrder.id },
                            data: {
                                status: order.status,
                                marketplace: normalizedMarketplace,
                                totalAmount: Number(order.totalAmount || 0),
                                items: order.items as any,
                                rawData: order as any,
                                shipmentPackageId: shipmentPackageId || existingOrder.shipmentPackageId
                            }
                        });

                        updatedCount++;
                        details.push({ order: orderNumber, action: 'StatusUpdate', status: order.status, prevStatus: existingOrder.status });
                    }
                }
            } catch (err: any) {
                console.error(`[SYNC_ORDER_ERROR] Order: ${orderNumber}, Error:`, err);
                errors.push({ order: orderNumber, error: err.message });
            }
        }

        // 3. Update Last Sync Time (Only if we successfully processed data or it's a clear success)
        // Prevent updating lastSync if we found 0 items, to ensure we verify again with the full window next time,
        // or if there were critical errors.
        if (marketplaceConfig && (savedCount > 0 || updatedCount > 0) && errors.length === 0) {
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
