import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, total, kasaId, description, paymentMode, customerName, customerId, earnedPoints, pointsUsed, couponCode } = body;

        console.log('Sales Create Request:', { total, kasaId, paymentMode, customerName }); // Debug log

        // 1. Kasa ID Güvenli Seçim (Fallback Logic)
        let targetKasaId = (kasaId === 'CashKasa' || !kasaId) ? undefined : kasaId;

        // Normalize payment mode for backend logic
        const effectivePaymentMode = (paymentMode === 'card' || paymentMode === 'credit_card') ? 'credit_card' : paymentMode;

        if (!targetKasaId) {
            // Eğer Kredi Kartı ise POS tipinde kasa ara, yoksa ilk aktif kasayı al
            if (effectivePaymentMode === 'credit_card') {
                const posKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: { contains: 'POS' } } });
                targetKasaId = posKasa?.id;
                // If no POS kasa found, look for Banka
                if (!targetKasaId) {
                    const bankKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: 'Banka' } });
                    targetKasaId = bankKasa?.id;
                }
            } else if (effectivePaymentMode === 'transfer') {
                const bankKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: 'Banka' } });
                targetKasaId = bankKasa?.id;
            }

            // General Fallback
            if (!targetKasaId) {
                const anyKasa = await prisma.kasa.findFirst({ where: { isActive: true } });
                targetKasaId = anyKasa?.id;
            }
        }

        if (!targetKasaId) {
            console.error('Kasa Bulunamadı: Hiçbir aktif kasa yok.');
            return NextResponse.json({ success: false, error: 'Sistemde aktif kasa bulunamadı. Lütfen ayarlardan en az bir kasa ekleyin.' }, { status: 400 });
        }

        // 2. Sipariş No
        const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 8);
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderNumber = `POS-${dateStr}-${randomSuffix}`;
        const finalTotal = parseFloat(total);

        const result = await prisma.$transaction(async (tx) => {
            // A. Create Order
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
                    items: items as any,
                    rawData: { targetKasaId, description, paymentMode }
                }
            });

            // B. Update Product Stocks
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        try {
                            await tx.product.update({
                                where: { id: String(item.productId) },
                                data: { stock: { decrement: Number(item.qty || item.quantity || 1) } }
                            });
                        } catch (e) { console.error("Stock update error (ignoring):", e); }
                    }
                }
            }

            // C. Update Kasa (Only if NOT account sale)
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

            // Append REF for invoicing logic
            transactionDesc += ` | REF:${order.id}`;

            await tx.transaction.create({
                data: {
                    type: 'Sales',
                    amount: finalTotal,
                    description: transactionDesc,
                    kasaId: targetKasaId,
                    customerId: customerId || null
                }
            });

            // E. Update Customer Balance & Points
            if (customerId) {
                const updateData: any = {};
                if (effectivePaymentMode === 'account') {
                    updateData.balance = { increment: finalTotal };
                }

                // Add earned points and deduct used points
                const netPoints = (earnedPoints || 0) - (pointsUsed || 0);
                if (netPoints !== 0) {
                    updateData.points = { increment: netPoints };
                }

                if (Object.keys(updateData).length > 0) {
                    await tx.customer.update({
                        where: { id: customerId },
                        data: updateData
                    });
                }
            }

            // F. Mark Coupon as Used
            if (couponCode) {
                await tx.coupon.update({
                    where: { code: couponCode },
                    data: { isUsed: true }
                });
            }

            // G. Handle Bank Commission Expense
            if (effectivePaymentMode === 'credit_card') {
                try {
                    const settingsRes = await tx.appSettings.findUnique({ where: { key: 'salesExpenses' } });
                    const salesExpenses = settingsRes?.value as any;

                    if (salesExpenses?.posCommissions) {
                        // Determine which installment config to use
                        const instLabelRaw = body.installmentLabel;
                        const instCount = body.installments || body.installmentCount || 1;
                        const instLabelFallback = instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim';

                        let commissionConfig;

                        // Priority 1: Exact label match from frontend selection
                        if (instLabelRaw) {
                            commissionConfig = salesExpenses.posCommissions.find((c: any) => c.installment === instLabelRaw);
                        }

                        // Priority 2: Fallback to constructed label (backward compatibility)
                        if (!commissionConfig) {
                            commissionConfig = salesExpenses.posCommissions.find((c: any) =>
                                c.installment === instLabelFallback || (instCount === 1 && c.installment === 'Tek Çekim')
                            );
                        }

                        // Priority 3: Fallback to first available if strictly needed
                        if (!commissionConfig && salesExpenses.posCommissions.length > 0) {
                            commissionConfig = salesExpenses.posCommissions[0];
                        }

                        if (commissionConfig && Number(commissionConfig.rate) > 0) {
                            const rate = Number(commissionConfig.rate);
                            const commissionAmount = (finalTotal * rate) / 100;

                            // 1. Create Expense Transaction
                            await tx.transaction.create({
                                data: {
                                    type: 'Expense',
                                    amount: commissionAmount,
                                    description: `Banka POS Komisyon Gideri (${commissionConfig.installment}) - Satış: ${orderNumber}`,
                                    kasaId: targetKasaId,
                                    date: new Date()
                                }
                            });

                            // 2. Deduct from Kasa (Net result reflects reality)
                            await tx.kasa.update({
                                where: { id: targetKasaId },
                                data: { balance: { decrement: commissionAmount } }
                            });
                        }
                    }
                } catch (commErr) {
                    console.error('Commission Error (ignored to not block sale):', commErr);
                }
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
