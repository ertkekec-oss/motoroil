import { NextResponse } from 'next/server';
import { MarketplaceServiceFactory } from '@/services/marketplaces';
import prisma from '@/lib/prisma'; // Değişiklik: Statik import

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, config } = body;

        if (!type || !config) {
            return NextResponse.json(
                { success: false, error: 'Eksik parametreler' },
                { status: 400 }
            );
        }

        console.log(`Syncing orders for ${type}...`);
        const service = MarketplaceServiceFactory.createService(type as any, config);

        // Son 1 haftalık siparişleri çek
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const orders = await service.getOrders(startDate, endDate);

        // 0. E-ticaret kategorisini garantile
        let ecommerceCategory = await prisma.customerCategory.findFirst({
            where: { name: 'E-ticaret' }
        });

        if (!ecommerceCategory) {
            console.log('📦 E-ticaret kategorisi oluşturuluyor...');
            ecommerceCategory = await prisma.customerCategory.create({
                data: {
                    name: 'E-ticaret',
                    description: 'E-ticaret entegrasyonundan gelen müşteriler'
                }
            });
        }

        let savedCount = 0;
        let updatedCount = 0;
        let errors: any[] = [];
        let details: any[] = [];

        for (const order of orders) {
            try {
                if (!order.orderNumber) {
                    throw new Error('Sipariş numarası (orderNumber) eksik!');
                }

                // Müşteri Senkronizasyonu
                let customerId = null;
                if (order.customerName) {
                    const customerData = {
                        name: order.customerName,
                        email: order.customerEmail,
                        phone: order.invoiceAddress?.phone || order.shippingAddress?.phone || '', // Adresten telefon al
                        address: typeof order.invoiceAddress === 'string' ? order.invoiceAddress : JSON.stringify(order.invoiceAddress),
                        categoryId: ecommerceCategory.id
                    };

                    let customer = await prisma.customer.findFirst({
                        where: {
                            OR: [
                                { email: order.customerEmail ? order.customerEmail : undefined }, // Email varsa email ile
                                { name: order.customerName }  // Yoksa isim ile (veya email yoksa)
                            ].filter(c => c.email !== undefined || c.name !== undefined) as any // filtreleme
                        }
                    });

                    if (customer) {
                        // Varsa kategorisini güncelle (E-ticaret müşterisi olduğunu işaretle)
                        if (customer.categoryId !== ecommerceCategory.id) {
                            await prisma.customer.update({
                                where: { id: customer.id },
                                data: { categoryId: ecommerceCategory.id }
                            });
                        }
                        customerId = customer.id;
                    } else {
                        // Yoksa oluştur
                        const newCustomer = await prisma.customer.create({
                            data: {
                                name: customerData.name,
                                email: customerData.email,
                                phone: customerData.phone,
                                address: customerData.address,
                                categoryId: ecommerceCategory.id
                            }
                        });
                        customerId = newCustomer.id;
                        console.log(`👤 Yeni E-ticaret müşterisi oluşturuldu: ${newCustomer.name}`);
                    }
                }

                // Sipariş zaten var mı kontrol et (orderNumber unique alan olduğu için findUnique kullanabiliriz)
                // Ancak veritabanında marketplace + orderNumber unique olmayabilir, sadece orderNumber unique ise:
                const existingOrder = await prisma.order.findUnique({
                    where: {
                        orderNumber: order.orderNumber
                    }
                });

                if (!existingOrder) {
                    await prisma.order.create({
                        data: {
                            marketplace: type,
                            marketplaceId: order.id || `UNKNOWN-${Date.now()}`, // ID yoksa uydur
                            orderNumber: order.orderNumber,
                            customerName: order.customerName || 'Misafir',
                            customerEmail: order.customerEmail,
                            totalAmount: typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : (order.totalAmount || 0),
                            currency: order.currency || 'TRY',
                            status: order.status || 'Yeni',
                            orderDate: new Date(order.orderDate),
                            items: order.items as any, // JSON
                            shippingAddress: order.shippingAddress as any, // JSON
                            invoiceAddress: order.invoiceAddress as any, // JSON
                            cargoTrackingNo: order.cargoTrackingNumber ? String(order.cargoTrackingNumber) : null,
                            cargoProvider: order.cargoProvider,
                            rawData: order as any
                        }
                    });
                    savedCount++;
                    details.push({ order: order.orderNumber, action: 'Created' });
                } else {
                    // Mevcutsa güncelle
                    await prisma.order.update({
                        where: { id: existingOrder.id },
                        data: {
                            status: order.status,
                            updatedAt: new Date()
                        }
                    });
                    updatedCount++;
                    details.push({ order: order.orderNumber, action: 'Updated', oldStatus: existingOrder.status, newStatus: order.status });
                }
            } catch (err: any) {
                console.error(`Sipariş kayıt hatası (${order.orderNumber}):`, err);
                errors.push({ orderNumber: order.orderNumber, error: err.message });
            }
        }

        // Son senkronizasyon zamanını güncelle
        try {
            await prisma.marketplaceConfig.upsert({
                where: { type: type },
                update: { lastSync: new Date() },
                create: {
                    type: type,
                    settings: config,
                    isActive: true,
                    lastSync: new Date()
                }
            });
        } catch (settingsErr) {
            console.error('Marketplace ayar güncelleme hatası:', settingsErr);
        }

        return NextResponse.json({
            success: true,
            message: `${orders.length} veri çekildi. ${savedCount} yeni, ${updatedCount} güncelleme.`,
            count: orders.length,
            savedCount: savedCount,
            updatedCount: updatedCount,
            details: details,
            errors: errors.length > 0 ? errors : undefined,
            orders: orders.slice(0, 5) // Önizleme içi ilk 5 sipariş
        });

    } catch (error: any) {
        console.error('Marketplace Sync Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Senkronizasyon hatası' },
            { status: 500 }
        );
    }
}
