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

        // VERIFICATION LOG
        console.log(`[SYNC_START] User: ${session.username}, SessionCompanyId: ${(session as any).companyId}, TenantId: ${session.tenantId}`);

        if (!type || !config) {
            return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 });
        }

        // 0. Tenant Isolation - Find Active Company
        // 0. Tenant Isolation - Find Active Company
        // Robust extraction: support both root-level and nested user object (NextAuth style compatibility)
        let companyId = (session as any).companyId || (session as any).user?.companyId;
        let companyName = 'Unknown';

        if (!companyId) {
            console.warn(`[MARKETPLACE] Session missing companyId for user ${session.username}. Attempting DB fallback.`);
            const company = await prisma.company.findFirst({
                where: { tenantId: session.tenantId }
            });

            if (company) {
                companyId = company.id;
                companyName = company.name;
            }
        } else {
            companyName = 'SessionCompany';
        }

        // CRITICAL GUARD: Prevent implementation of logic without companyId
        if (!companyId) {
            console.error(`[MARKETPLACE] CRITICAL: Company ID missing! User: ${session.username}, Tenant: ${session.tenantId}`);
            throw new Error("COMPANY_ID_MISSING: Firma yetkisi doğrulanamadı. Lütfen sistemi tamamen kapatıp tekrar giriş yapmayı deneyin.");
        }

        console.log(`[MARKETPLACE] Syncing for ${type} (Company: ${companyName}, ID: ${companyId})`);
        const service = MarketplaceServiceFactory.createService(type as any, config);

        // Fetch settings from config or default
        const daysToSync = typeof config.days === 'number' ? config.days : 3; // Reduced default from 7 to 3
        const processLimit = typeof config.limit === 'number' ? config.limit : 50; // Process max 50 items per execution

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToSync);

        console.log(`[MARKETPLACE] Fetching orders from ${startDate.toISOString()}...`);
        const t0 = Date.now();
        const allOrders = await service.getOrders(startDate, endDate);
        console.log(`[MARKETPLACE] Fetched ${allOrders.length} orders in ${Date.now() - t0}ms`);

        // Slice to avoid Vercel 5min timeout
        const orders = allOrders.slice(0, processLimit);
        if (allOrders.length > processLimit) {
            console.warn(`[MARKETPLACE] Limiting processing to ${processLimit} items (Total: ${allOrders.length}). Run sync again to process more.`);
        }

        // Ensure E-commerce Category
        console.log(`[UPSERT_DEBUG] ID: ${companyId}, Type: ${typeof companyId}`);
        const ecommerceCategory = await prisma.customerCategory.upsert({
            where: {
                companyId_name: {
                    companyId: companyId,
                    name: 'E-ticaret'
                }
            },
            create: {
                companyId: companyId,
                name: 'E-ticaret',
                description: 'Web Satış Kanalı'
            },
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
