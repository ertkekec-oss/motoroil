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
        let companyId = (session as any).companyId;
        let companyName = 'Unknown';

        if (!companyId) {
            console.warn(`[MARKETPLACE] Session missing companyId for user ${session.username}. Attempting DB fallback.`);

            // Fallback: Fetch via User's accessible companies
            const dbUser = await prisma.user.findUnique({
                where: { id: session.id },
                include: { accessibleCompanies: { take: 1, include: { company: true } } }
            });

            if (dbUser?.accessibleCompanies?.[0]) {
                companyId = dbUser.accessibleCompanies[0].companyId;
                companyName = dbUser.accessibleCompanies[0].company.name;
                console.log(`[MARKETPLACE] Recovered companyId from DB: ${companyId}`);
            } else {
                // Second Fallback: Tenant's first company (Admin fallback)
                const company = await prisma.company.findFirst({
                    where: { tenantId: session.tenantId }
                });
                if (company) {
                    companyId = company.id;
                    companyName = company.name;
                    console.log(`[MARKETPLACE] Recovered companyId from Tenant: ${companyId}`);
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

        for (const order of orders) {
            try {
                // 1. Customer Sync
                const customer = await prisma.customer.upsert({
                    where: { email_companyId: { email: order.customerEmail || `guest-${order.orderNumber}@${type}.com`, companyId: companyId } }, // Explicit companyId
                    create: {
                        companyId: companyId, // Explicit
                        name: order.customerName || 'Pazaryeri Müşterisi',
                        email: order.customerEmail,
                        phone: order.invoiceAddress?.phone || '',
                        address: JSON.stringify(order.invoiceAddress),
                        categoryId: categoryId // Can be null
                    },
                    update: {}
                });

                // 2. Idempotency Guard (Find existing order)
                const existingOrder = await prisma.order.findFirst({
                    where: { companyId, orderNumber: order.orderNumber }
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
