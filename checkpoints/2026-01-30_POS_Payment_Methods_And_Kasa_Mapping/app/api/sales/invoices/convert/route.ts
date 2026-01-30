import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, customerId, invoiceNo, taxNumber, taxOffice, address, phone, name, isFormal, description, items: customItems, discount } = body;

        // 1. Fetch the original order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        // 2. Create the SalesInvoice
        const result = await prisma.$transaction(async (tx) => {
            const itemsToUse = customItems || (typeof order.items === 'string' ? JSON.parse(order.items) : order.items);

            // Calculate Totals based on items (Net -> OTV -> VAT)
            const subtotal = itemsToUse.reduce((acc: number, it: any) => acc + (Number(it.qty || 1) * Number(it.price || 0)), 0);
            const totalOtv = itemsToUse.reduce((acc: number, it: any) => acc + (Number(it.qty || 1) * Number(it.price || 0) * (Number(it.otv || 0) / 100)), 0);

            // VAT is calculated on (Net + OTV)
            const totalVat = itemsToUse.reduce((acc: number, it: any) => {
                const lineNet = Number(it.qty || 1) * Number(it.price || 0);
                const lineOtv = lineNet * (Number(it.otv || 0) / 100);
                return acc + (lineNet + lineOtv) * (Number(it.vat || 20) / 100);
            }, 0);

            let discAmount = 0;
            if (discount) {
                if (discount.type === 'percent') {
                    discAmount = subtotal * (Number(discount.value) / 100);
                } else {
                    discAmount = Number(discount.value);
                }
            }

            const grandTotal = subtotal + totalOtv + totalVat - discAmount;

            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: invoiceNo || `INV-${Date.now()}`,
                    customerId: customerId,
                    amount: subtotal - discAmount,
                    taxAmount: totalVat + totalOtv, // Total tax includes OTV
                    totalAmount: grandTotal,
                    description: description || `POS Siparişi Faturalandırma: ${order.orderNumber}`,
                    items: itemsToUse as any,
                    isFormal: isFormal || false,
                    status: 'Onaylandı'
                }
            });

            // B. Update Customer with provided info
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    name: name || undefined,
                    phone: phone || undefined,
                    taxNumber: taxNumber || undefined,
                    taxOffice: taxOffice || undefined,
                    address: address || undefined
                }
            });

            // C. Update Products' Tax Settings (Learning)
            for (const item of itemsToUse) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: String(item.productId) },
                        data: {
                            salesVat: Number(item.vat || 20),
                            salesOtv: Number(item.otv || 0)
                        }
                    }).catch(e => console.warn(`Product ${item.productId} tax update failed:`, e.message));
                }
            }

            // D. Record Bank Commission if it's a Card Sale and not already recorded
            const rawData = order.rawData as any;
            const effectivePaymentMode = (rawData?.paymentMode === 'card' || rawData?.paymentMode === 'credit_card') ? 'credit_card' : rawData?.paymentMode;

            if (effectivePaymentMode === 'credit_card') {
                try {
                    // Check if already recorded to avoid double counting
                    const existingComm = await tx.transaction.findFirst({
                        where: {
                            description: { contains: order.orderNumber },
                            type: 'Expense'
                        }
                    });

                    if (!existingComm) {
                        const settingsRes = await tx.appSettings.findUnique({ where: { key: 'salesExpenses' } });
                        const salesExpenses = settingsRes?.value as any;

                        if (salesExpenses?.posCommissions) {
                            const instCount = rawData?.installments || rawData?.installmentCount || 1;
                            const instLabel = instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim';

                            let commissionConfig = salesExpenses.posCommissions.find((c: any) =>
                                c.installment === instLabel || (instCount === 1 && c.installment === 'Tek Çekim')
                            );

                            if (!commissionConfig && salesExpenses.posCommissions.length > 0) {
                                commissionConfig = salesExpenses.posCommissions[0];
                            }

                            if (commissionConfig && Number(commissionConfig.rate) > 0) {
                                const rate = Number(commissionConfig.rate);
                                const commissionAmount = (Number(invoice.totalAmount) * rate) / 100;

                                // 1. Create Expense Transaction
                                await tx.transaction.create({
                                    data: {
                                        type: 'Expense',
                                        amount: commissionAmount,
                                        description: `Banka POS Komisyon Gideri (${commissionConfig.installment}) - Sipariş (Fatura): ${order.orderNumber}`,
                                        kasaId: rawData?.targetKasaId || (await tx.kasa.findFirst())?.id || '',
                                        date: new Date()
                                    }
                                });

                                // 2. Deduct from Kasa (Note: POS Kasa should be selected in rawData)
                                if (rawData?.targetKasaId) {
                                    await tx.kasa.update({
                                        where: { id: rawData.targetKasaId },
                                        data: { balance: { decrement: commissionAmount } }
                                    });
                                }
                            }
                        }
                    }
                } catch (commErr) {
                    console.error('Commission recording error in conversion:', commErr);
                }
            }

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: result });

    } catch (error: any) {
        console.error('Invoice Conversion Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
