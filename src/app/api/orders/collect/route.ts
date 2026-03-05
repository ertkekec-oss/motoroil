import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // Robust Company Resolution (Support Impersonation)
        let companyId = session.impersonateTenantId ? null : (session as any).companyId;

        if (!companyId) {
            const targetTenantId = session.impersonateTenantId || session.tenantId;
            const company = await prisma.company.findFirst({
                where: { tenantId: targetTenantId }
            });
            companyId = company?.id;
        }

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const { orderIds } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Geçerli sipariş ID\'leri gerekli'
            }, { status: 400 });
        }

        console.log('💰 Tahsilat işlemi başlatıldı:', { orderIds });

        // 1. E-ticaret kasasını bul veya oluştur (Tenant Scoped)
        let ecommerceKasa = await prisma.kasa.findFirst({
            where: {
                name: 'E-ticaret',
                companyId: companyId // Strict Isolation
            }
        });

        if (!ecommerceKasa) {
            console.log('📦 E-ticaret kasası bulunamadı, oluşturuluyor...');
            ecommerceKasa = await prisma.kasa.create({
                data: {
                    companyId: companyId, // Set Company ID
                    name: 'E-ticaret',
                    type: 'Nakit',
                    balance: 0,
                    currency: 'TRY',
                    isActive: true
                }
            });
            console.log('✅ E-ticaret kasası oluşturuldu:', ecommerceKasa.id);
        }

        // 2. E-ticaret kategorisini bul veya oluştur (Global or Tenant? Assuming Global Name for now, or just reuse)
        // If CustomerCategory doesn't have companyId, we just find by name.
        let ecommerceCategory = await prisma.customerCategory.findFirst({
            where: { name: 'E-ticaret' }
        });

        if (!ecommerceCategory) {
            // Check if we can create it (might be global)
            try {
                console.log('📦 E-ticaret kategorisi bulunamadı, oluşturuluyor...');
                ecommerceCategory = await prisma.customerCategory.create({
                    data: {
                        name: 'E-ticaret',
                        description: 'E-ticaret platformlarından sipariş veren müşteriler'
                    }
                });
                console.log('✅ E-ticaret kategorisi oluşturuldu:', ecommerceCategory.id);
            } catch (catErr) {
                // concurrency or permission issue, try fetching again
                ecommerceCategory = await prisma.customerCategory.findFirst({ where: { name: 'E-ticaret' } });
            }
        }

        if (!ecommerceCategory) {
            return NextResponse.json({ success: false, error: 'E-ticaret kategorisi hatası.' }, { status: 500 });
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

                // SECURITY: Verify Order Ownership
                if (order.companyId !== companyId) {
                    results.push({ orderId, success: false, error: 'Yetkisiz sipariş erişimi' });
                    continue;
                }

                // Müşteriyi bul veya oluştur (Tenant Scoped)
                let customer = await prisma.customer.findFirst({
                    where: {
                        companyId: companyId, // Strict Isolation
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
                            companyId: companyId, // Set Company ID
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

                // Atomik Tahsilat işlemi (Transaction Kalkanı)
                const amount = parseFloat(order.totalAmount.toString());

                await prisma.$transaction(async (tx) => {
                    // Kasaya para ekle
                    await tx.kasa.update({
                        where: { id: ecommerceKasa.id },
                        data: { balance: { increment: amount } }
                    });

                    // Müşteri bakiyesini güncelle (tahsil edildi olarak işaretle)
                    await tx.customer.update({
                        where: { id: customer.id },
                        data: { balance: { decrement: amount } }
                    });

                    // Transaction kaydı oluştur
                    await tx.transaction.create({
                        data: {
                            companyId: companyId,
                            type: 'Tahsilat',
                            amount: amount,
                            description: `E-ticaret sipariş tahsilatı: ${order.orderNumber || order.id}`,
                            kasaId: ecommerceKasa.id,
                            customerId: customer.id,
                            date: new Date()
                        }
                    });

                    // Sipariş durumunu güncelle
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: 'Tahsil Edildi' }
                    });
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
