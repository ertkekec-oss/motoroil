import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { orderIds } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Geçerli sipariş ID\'leri gerekli'
            }, { status: 400 });
        }

        console.log('💰 Tahsilat işlemi başlatıldı:', { orderIds });

        // 1. E-ticaret kasasını bul veya oluştur
        let ecommerceKasa = await prisma.kasa.findFirst({
            where: { name: 'E-ticaret' }
        });

        if (!ecommerceKasa) {
            console.log('📦 E-ticaret kasası bulunamadı, oluşturuluyor...');
            ecommerceKasa = await prisma.kasa.create({
                data: {
                    name: 'E-ticaret',
                    type: 'Nakit',
                    balance: 0,
                    currency: 'TRY',
                    isActive: true
                }
            });
            console.log('✅ E-ticaret kasası oluşturuldu:', ecommerceKasa.id);
        }

        // 2. E-ticaret kategorisini bul veya oluştur
        let ecommerceCategory = await prisma.customerCategory.findFirst({
            where: { name: 'E-ticaret' }
        });

        if (!ecommerceCategory) {
            console.log('📦 E-ticaret kategorisi bulunamadı, oluşturuluyor...');
            ecommerceCategory = await prisma.customerCategory.create({
                data: {
                    name: 'E-ticaret',
                    description: 'E-ticaret platformlarından sipariş veren müşteriler'
                }
            });
            console.log('✅ E-ticaret kategorisi oluşturuldu:', ecommerceCategory.id);
        }

        const results = [];
        let totalCollected = 0;

        for (const orderId of orderIds) {
            try {
                // Siparişi bul
                const order = await prisma.order.findUnique({
                    where: { id: orderId }
                });

                if (!order) {
                    results.push({ orderId, success: false, error: 'Sipariş bulunamadı' });
                    continue;
                }

                // Müşteriyi bul veya oluştur
                let customer = await prisma.customer.findFirst({
                    where: {
                        OR: [
                            { name: order.customerName },
                            { email: order.customerEmail }
                        ]
                    }
                });

                if (!customer) {
                    console.log('👤 Müşteri bulunamadı, oluşturuluyor:', order.customerName);
                    customer = await prisma.customer.create({
                        data: {
                            name: order.customerName,
                            email: order.customerEmail || '',
                            phone: '',
                            categoryId: ecommerceCategory.id,
                            balance: 0
                        }
                    });
                } else if (customer.categoryId !== ecommerceCategory.id) {
                    // Müşteriyi e-ticaret kategorisine ekle
                    await prisma.customer.update({
                        where: { id: customer.id },
                        data: { categoryId: ecommerceCategory.id }
                    });
                    console.log('✅ Müşteri e-ticaret kategorisine eklendi:', customer.name);
                }

                // Tahsilat işlemi
                const amount = parseFloat(order.totalAmount.toString());

                // Kasaya para ekle
                await prisma.kasa.update({
                    where: { id: ecommerceKasa.id },
                    data: { balance: { increment: amount } }
                });

                // Müşteri bakiyesini güncelle (tahsil edildi olarak işaretle)
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { balance: { decrement: amount } }
                });

                // Transaction kaydı oluştur
                await prisma.transaction.create({
                    data: {
                        type: 'Tahsilat',
                        amount: amount,
                        description: `E-ticaret sipariş tahsilatı: ${order.orderNumber || order.id}`,
                        kasaId: ecommerceKasa.id,
                        customerId: customer.id,
                        date: new Date()
                    }
                });

                // Sipariş durumunu güncelle
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'Tahsil Edildi'
                    }
                });

                totalCollected += amount;
                results.push({
                    orderId,
                    success: true,
                    amount,
                    customerName: customer.name
                });

                console.log(`✅ Tahsilat tamamlandı: ${order.orderNumber} - ${amount} TL`);

            } catch (orderError: any) {
                console.error(`❌ Sipariş tahsilat hatası (${orderId}):`, orderError);
                results.push({
                    orderId,
                    success: false,
                    error: orderError.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `${successCount} sipariş başarıyla tahsil edildi${failCount > 0 ? `, ${failCount} sipariş başarısız` : ''}. Toplam: ${totalCollected.toFixed(2)} TL`,
            results,
            totalCollected,
            kasaId: ecommerceKasa.id,
            kasaName: ecommerceKasa.name
        });

    } catch (error: any) {
        console.error('❌ Tahsilat hatası:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
