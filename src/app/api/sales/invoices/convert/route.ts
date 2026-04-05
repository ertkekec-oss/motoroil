import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        const body = await request.json();
        const { orderId, customerId, invoiceNo, taxNumber, taxOffice, address, phone, name, isFormal, status, description, items: customItems, discount, createWayslip, cancelPreviousPayment } = body;

        // 1. Fetch the original order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }
        
        // Security Check: Tenant isolation
        if (order.companyId !== session.companyId && session.tenantId !== 'PLATFORM_ADMIN') {
            const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
            if (!company || company.id !== order.companyId) {
                return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
            }
        }

        // 2. Create the SalesInvoice
        const result = await prisma.$transaction(async (tx) => {
            const itemsToUse = customItems || (typeof order.items === 'string' ? JSON.parse(order.items) : order.items);

            const rawSubtotal = itemsToUse.reduce((acc: number, it: any) => acc + (Number(it.qty || 1) * Number(it.price || 0)), 0);

            let discAmount = 0;
            if (discount) {
                if (discount.type === 'percent') {
                    discAmount = rawSubtotal * (Number(discount.value) / 100);
                } else {
                    discAmount = Number(discount.value);
                }
            }

            // Calculate Discount Ratio
            let discountRatio = rawSubtotal > 0 ? (discAmount / rawSubtotal) : 0;
            if (discountRatio > 1) discountRatio = 1;

            const subtotal = rawSubtotal - discAmount;

            // Calculate Taxes with discounted net logic
            const totalOtv = itemsToUse.reduce((acc: number, it: any) => {
                let lineNet = Number(it.qty || 1) * Number(it.price || 0);
                lineNet = lineNet * (1 - discountRatio); // Discounted Base
                
                if (it.otvType === 'Birim Başına') return acc + (Number(it.otv || 0) * Number(it.qty || 1));
                return acc + (lineNet * (Number(it.otv || 0) / 100));
            }, 0);

            const totalVat = itemsToUse.reduce((acc: number, it: any) => {
                let lineNet = Number(it.qty || 1) * Number(it.price || 0);
                lineNet = lineNet * (1 - discountRatio); // Discounted Base
                
                let lineOtv = lineNet * (Number(it.otv || 0) / 100);
                if (it.otvType === 'Birim Başına') lineOtv = Number(it.otv || 0) * Number(it.qty || 1);
                
                const vatRate = it.vat !== undefined ? Number(it.vat) : 20;
                return acc + (lineNet + lineOtv) * (vatRate / 100);
            }, 0);

            const totalOiv = itemsToUse.reduce((acc: number, it: any) => {
                let lineNet = Number(it.qty || 1) * Number(it.price || 0);
                lineNet = lineNet * (1 - discountRatio); // Discounted Base
                
                let lineOtv = lineNet * (Number(it.otv || 0) / 100);
                if (it.otvType === 'Birim Başına') lineOtv = Number(it.otv || 0) * Number(it.qty || 1);
                
                return acc + (lineNet + lineOtv) * (Number(it.oiv || 0) / 100);
            }, 0);

            const grandTotal = subtotal + totalOtv + totalVat + totalOiv;

            // Check if an existing draft/proforma invoice exists for this order
            const existingDraft = await tx.salesInvoice.findFirst({
                where: { 
                    orderId: order.id,
                    isFormal: false
                }
            });

            let invoice;
            if (existingDraft) {
                invoice = await tx.salesInvoice.update({
                    where: { id: existingDraft.id },
                    data: {
                        amount: subtotal - discAmount,
                        taxAmount: totalVat + totalOtv + totalOiv,
                        totalAmount: grandTotal,
                        description: description || existingDraft.description,
                        items: itemsToUse as any,
                        isFormal: isFormal || false,
                        status: status || 'Onaylandı'
                    }
                });
            } else {
                invoice = await tx.salesInvoice.create({
                    data: {
                        companyId: order.companyId,
                        invoiceNo: invoiceNo || `INV-${Date.now()}`,
                        customerId: customerId,
                        orderId: order.id,
                        amount: subtotal - discAmount,
                        taxAmount: totalVat + totalOtv + totalOiv, // Total tax includes OTV and OIV
                        totalAmount: grandTotal,
                        description: description || `POS Siparişi Faturalandırma: ${order.orderNumber}`,
                        items: itemsToUse as any,
                        isFormal: isFormal || false,
                        status: status || 'Onaylandı'
                    }
                });
            }

            // If user requested a tied Wayslip
            let createdWayslip = null;
            if (createWayslip) {
                const wayslipNo = `IRS-${Date.now()}`;
                
                // Update the original invoice with the reference
                await tx.salesInvoice.update({
                    where: { id: invoice.id },
                    data: {
                        description: `[İrsaliyeli: ${wayslipNo}] ${invoice.description || ''}`.trim()
                    }
                });

                createdWayslip = await tx.salesInvoice.create({
                    data: {
                        companyId: order.companyId,
                        invoiceNo: wayslipNo,
                        customerId: customerId,
                        orderId: invoice.id, // Store parent invoice ID in orderId for back-reference
                        amount: subtotal - discAmount,
                        taxAmount: totalVat + totalOtv,
                        totalAmount: grandTotal,
                        description: `Otomatik Sevk İrsaliyesi - Fatura Ref: ${invoice.invoiceNo}`,
                        items: itemsToUse as any,
                        isFormal: false, // E-İrsaliye gönderimi için daha sonra Gönder butonuna basılabilir
                        status: 'İrsaliye'
                    }
                });
            }


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

            // C. Cancel previous payment if requested (Re-Structuring debt)
            if (cancelPreviousPayment) {
                // Bulunan tahsilatı bul (Sipariş/Fatura numarası geçen Tahsilat işlemleri)
                const previousPaymentTx = await tx.transaction.findFirst({
                    where: {
                        companyId: order.companyId,
                        customerId: customerId,
                        description: { contains: order.orderNumber },
                        type: { in: ['Payment', 'Tahsilat'] }
                    }
                });

                if (previousPaymentTx) {
                    // İşlemi ters çevir (Kasa bakiyesini düşüp, cari alacağı sıfırla/artır)
                    if (previousPaymentTx.kasaId) {
                        await tx.kasa.update({
                            where: { id: previousPaymentTx.kasaId },
                            data: { balance: { decrement: previousPaymentTx.amount } }
                        });
                    }

                    // Cari hesabı borçlandır (Çünkü ödemeyi iptal ettik)
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { increment: previousPaymentTx.amount } }
                    });

                    // İşlemi geçmişte kafa karıştırmaması için İptal olarak işaretle veya Açıklamasına İptal yaz
                    await tx.transaction.update({
                        where: { id: previousPaymentTx.id },
                        data: {
                            description: `[İPTAL EDİLDİ (Vadelendirme)] ${previousPaymentTx.description}`,
                            amount: 0 // finansal tabloyu yanıltmaması için
                        }
                    });

                    // Siparişin de paidAmount'unu sıfırla
                    await tx.order.update({
                        where: { id: order.id },
                        data: { paidAmount: 0 }
                    });
                }
            }

            // C. Update Products' Tax Settings and Description (Learning & Sync)
            for (const item of itemsToUse) {
                if (item.productId) {
                    const updateData: any = {
                        salesVat: Number(item.vat || 20),
                        salesOtv: Number(item.otv || 0)
                    };

                    if (item.showDesc !== undefined) {
                        updateData.showDescriptionOnInvoice = Boolean(item.showDesc);
                        if (item.showDesc && item.description) {
                            updateData.description = String(item.description);
                        }
                    }

                    await tx.product.update({
                        where: { id: String(item.productId) },
                        data: updateData
                    }).catch(e => console.warn(`Product ${item.productId} sync update failed:`, e.message));
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
                        const settingsRes = await tx.appSettings.findUnique({
                            where: {
                                companyId_key: {
                                    companyId: order.companyId,
                                    key: 'salesExpenses'
                                }
                            }
                        });
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
                                        companyId: order.companyId,
                                        type: 'Expense',
                                        amount: commissionAmount,
                                        description: `Banka POS Komisyon Gideri (${commissionConfig.installment}) - Sipariş (Fatura): ${order.orderNumber} | REF:${order.id}`,
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
