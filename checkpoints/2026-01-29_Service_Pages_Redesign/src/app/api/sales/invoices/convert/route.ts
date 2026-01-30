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

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: result });

    } catch (error: any) {
        console.error('Invoice Conversion Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
