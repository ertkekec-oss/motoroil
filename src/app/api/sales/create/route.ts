import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createJournalFromSale, createJournalFromTransaction } from '@/lib/accounting';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, total, kasaId, description, paymentMode, customerName, customerId, earnedPoints, pointsUsed, couponCode, referenceCode, branch } = body;

        console.log('Sales Create Request:', { total, kasaId, paymentMode, customerName, referenceCode });

        // 1. Kasa ID Güvenli Seçim
        let targetKasaId = (kasaId === 'CashKasa' || !kasaId) ? undefined : kasaId;

        // Normalize payment mode
        const effectivePaymentMode = (paymentMode === 'card' || paymentMode === 'credit_card') ? 'credit_card' : paymentMode;

        if (!targetKasaId) {
            if (effectivePaymentMode === 'credit_card') {
                const posKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: { contains: 'POS' } } });
                targetKasaId = posKasa?.id;
                if (!targetKasaId) {
                    const bankKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: 'Banka' } });
                    targetKasaId = bankKasa?.id;
                }
            } else if (effectivePaymentMode === 'transfer') {
                const bankKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: 'Banka' } });
                targetKasaId = bankKasa?.id;
            }

            if (!targetKasaId) {
                const anyKasa = await prisma.kasa.findFirst({ where: { isActive: true } });
                targetKasaId = anyKasa?.id;
            }
        }

        if (!targetKasaId) {
            console.error('Kasa Bulunamadı: Hiçbir aktif kasa yok.');
            return NextResponse.json({ success: false, error: 'Sistemde aktif kasa bulunamadı.' }, { status: 400 });
        }

        // 2. Sipariş No
        const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 8);
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderNumber = `POS-${dateStr}-${randomSuffix}`;
        const finalTotal = parseFloat(total);

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    marketplace: 'POS',
                    marketplaceId: 'LOCAL',
                    orderNumber: orderNumber,
                    customerName: customerName || 'Perakende Müşteri',
                    totalAmount: finalTotal,
                    currency: 'TRY',
                    status: 'Tamamlandı',
                    orderDate: new Date(),
                    branch: branch || 'Merkez',
                    items: items as any,
                    rawData: { targetKasaId, description, paymentMode, referenceCode }
                }
            });

            // B. Update Product Stocks
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        await tx.product.update({
                            where: { id: String(item.productId) },
                            data: { stock: { decrement: Number(item.qty || item.quantity || 1) } }
                        }).catch(e => console.error("Stock update error:", e));
                    }
                }
            }

            // C. Update Kasa
            if (effectivePaymentMode !== 'account') {
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { increment: finalTotal } }
                });
            }

            // D. Create Transaction
            let transactionDesc = description;
            if (!description || description.includes('POS Satışı')) {
                const modeLabel = effectivePaymentMode === 'credit_card' ? 'Kredi Kartı' :
                    effectivePaymentMode === 'account' ? 'Cari Hesap' :
                        effectivePaymentMode === 'transfer' ? 'Havale/EFT' : 'Nakit';
                transactionDesc = `POS Satışı (${modeLabel}) - ${customerName || 'Perakende'}`;
            }

            transactionDesc += ` | REF:${order.id}`;

            await tx.transaction.create({
                data: {
                    type: 'Sales',
                    amount: finalTotal,
                    description: transactionDesc,
                    kasaId: targetKasaId,
                    customerId: customerId || null,
                    branch: branch || 'Merkez'
                }
            });

            // E. Update Customer Balance
            if (customerId) {
                const updateData: any = {};
                if (effectivePaymentMode === 'account') {
                    updateData.balance = { increment: finalTotal };
                }
                const netPoints = (earnedPoints || 0) - (pointsUsed || 0);
                if (netPoints !== 0) {
                    updateData.points = { increment: netPoints };
                }
                if (Object.keys(updateData).length > 0) {
                    await tx.customer.update({ where: { id: customerId }, data: updateData });
                }
            }

            // F. Coupon
            if (couponCode) {
                const coupon = await tx.coupon.findUnique({ where: { code: couponCode } }) as any;
                if (coupon) {
                    await tx.coupon.update({
                        where: { code: couponCode },
                        data: { usedCount: (coupon.usedCount || 0) + 1, lastUsedAt: new Date() }
                    });
                }
            }

            // G. Bank Commission
            if (effectivePaymentMode === 'credit_card') {
                try {
                    const settingsRes = await tx.appSettings.findUnique({ where: { key: 'salesExpenses' } });
                    const salesExpenses = settingsRes?.value as any;

                    if (salesExpenses?.posCommissions) {
                        const instLabelRaw = body.installmentLabel;
                        const instCount = body.installments || body.installmentCount || 1;
                        const instLabelFallback = instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim';

                        let commissionConfig = salesExpenses.posCommissions.find((c: any) =>
                            c.installment === instLabelRaw ||
                            c.installment === instLabelFallback ||
                            (instCount === 1 && c.installment === 'Tek Çekim')
                        );

                        if (commissionConfig && Number(commissionConfig.rate) > 0) {
                            const rate = Number(commissionConfig.rate);
                            const commissionAmount = (finalTotal * rate) / 100;

                            const commTrx = await tx.transaction.create({
                                data: {
                                    type: 'Expense',
                                    amount: commissionAmount,
                                    description: `Banka POS Komisyon Gideri (${commissionConfig.installment})`,
                                    kasaId: targetKasaId,
                                    date: new Date(),
                                    branch: branch || 'Merkez'
                                }
                            });

                            await createJournalFromTransaction(commTrx, tx);

                            await tx.kasa.update({
                                where: { id: targetKasaId },
                                data: { balance: { decrement: commissionAmount } }
                            });
                        }
                    }
                } catch (commErr) {
                    console.error('Commission Error:', commErr);
                }
            }

            // H. Accounting Enrichment
            const enrichedItems = [];
            if (Array.isArray(items)) {
                for (const item of items) {
                    const p = await tx.product.findUnique({ where: { id: String(item.productId) } });
                    enrichedItems.push({
                        ...item,
                        vat: p?.salesVat || 20,
                        price: p?.price || item.price,
                    });
                }
            }

            // I. Create Journal
            try {
                await createJournalFromSale(order, enrichedItems, targetKasaId, tx);
            } catch (accErr) {
                console.error('[Accounting Sync Error]:', accErr);
            }

            return order;
        });

        return NextResponse.json({
            success: true,
            orderId: result.id,
            orderNumber: result.orderNumber,
            message: 'Satış başarıyla kaydedildi.'
        });

    } catch (error: any) {
        console.error('Sale Create Error Full:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Satış kaydedilemedi.' },
            { status: 500 }
        );
    }
}
