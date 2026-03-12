import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { orderId, items } = body; 
        
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });

        const companyId = order.companyId;

        // 1. Resolve Customer
        const addressObj = typeof order.invoiceAddress === 'string' ? JSON.parse(order.invoiceAddress) : (order.invoiceAddress || {});
        let taxNumber = addressObj?.taxNumber || addressObj?.tcIdentityNumber || addressObj?.tckn || addressObj?.vkn;
        if (!taxNumber || taxNumber.trim() === '') {
            taxNumber = '11111111111';
        }
        
        let fullName = addressObj?.fullName || addressObj?.companyName || order.customerName || 'Bilinmeyen Müşteri';
        if (fullName.trim() === '') fullName = 'Bilinmeyen Müşteri';

        const taxOffice = addressObj?.taxOffice || 'Bilinmiyor';
        const fullAddress = addressObj?.fullAddress || addressObj?.address1 || 'Türkiye';
        const email = order.customerEmail || 'no-reply@periodya.com';

        let customer = await prisma.customer.findFirst({
            where: { companyId, OR: [{ taxNumber }, { name: fullName }] }
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    companyId,
                    name: fullName,
                    taxNumber,
                    taxOffice,
                    address: fullAddress,
                    email,
                    categoryId: null
                }
            });
        } else {
             await prisma.customer.update({
                 where: { id: customer.id },
                 data: {
                     taxNumber: customer.taxNumber || taxNumber,
                     address: customer.address || fullAddress
                 }
             });
        }

        // 2. Transaction
        const invoice = await prisma.$transaction(async (tx) => {
            const branch = order.branch || 'Merkez';
            
            // A. Deduct stock for mapped items
            for (const item of items) {
                if (item.productId) {
                    const qty = Number(item.qty || 1);
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: String(item.productId), branch } },
                        update: { quantity: { decrement: qty } },
                        create: { productId: String(item.productId), branch, quantity: -qty }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: String(item.productId), branch, companyId,
                            quantity: -qty, type: 'SALE', referenceId: order.id,
                            price: Number(item.price || 0)
                        }
                    });
                    if (branch === 'Merkez') {
                        await tx.product.update({
                            where: { id: String(item.productId) },
                            data: { stock: { decrement: qty } }
                        }).catch(e => console.error(e));
                    }
                }
            }

            // B. Calculate Totals Wait, e-commerce orders might have their own prices which are correct.
            let subtotal = 0;
            let totalVat = 0;
            let totalOtv = 0;

            for (const it of items) {
                const qty = Number(it.qty || 1);
                const price = Number(it.price || 0);
                const vat = Number(it.vat || 20);
                const otv = Number(it.otv || 0);

                const lineNet = qty * price;
                const lineOtv = lineNet * (otv / 100);
                const lineVat = (lineNet + lineOtv) * (vat / 100);

                subtotal += lineNet;
                totalOtv += lineOtv;
                totalVat += lineVat;
            }
            
            const grandTotal = subtotal + totalOtv + totalVat;

            // C. Create SalesInvoice
            const inv = await tx.salesInvoice.create({
                data: {
                    companyId,
                    invoiceNo: `ECOM-${Date.now()}`,
                    customerId: customer.id,
                    orderId: order.id,
                    amount: subtotal,
                    taxAmount: totalVat + totalOtv,
                    totalAmount: grandTotal > 0 ? grandTotal : Number(order.totalAmount || 0),
                    description: `E-Ticaret Siparişi Faturalandırma: ${order.orderNumber} - ${order.marketplace}`,
                    items: items,
                    isFormal: false, // Initial state before Nilvera call
                    status: 'Hazırlanıyor'
                }
            });

            // D. Update Order Status
            await tx.order.update({
                where: { id: order.id },
                data: { status: 'Faturalandırıldı' }
            });

            return inv;
        });

        return NextResponse.json({ success: true, invoice });
    } catch (e: any) {
        console.error('E-commerce convert error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
