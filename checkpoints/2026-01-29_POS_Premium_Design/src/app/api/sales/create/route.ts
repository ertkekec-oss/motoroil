import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, total, kasaId, description, paymentMode, customerName, customerId } = body;

        // 1. Kasa ID Güvenli Seçim (Fallback Logic)
        let targetKasaId = kasaId;
        if (!targetKasaId) {
            // Eğer Kredi Kartı ise POS tipinde kasa ara, yoksa ilk aktif kasayı al
            if (paymentMode === 'credit_card') {
                const posKasa = await prisma.kasa.findFirst({ where: { isActive: true, type: { contains: 'POS' } } });
                targetKasaId = posKasa?.id;
            }

            if (!targetKasaId) {
                const anyKasa = await prisma.kasa.findFirst({ where: { isActive: true } });
                targetKasaId = anyKasa?.id;
            }
        }

        if (!targetKasaId) {
            return NextResponse.json({ success: false, error: 'İşlem yapılacak kasa/hesap bulunamadı.' }, { status: 400 });
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

            // C. Update Kasa (Only if NOT account sale)
            if (paymentMode !== 'account') {
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { increment: finalTotal } }
                });
            }

            // D. Create Transaction
            await tx.transaction.create({
                data: {
                    type: 'Sales',
                    amount: finalTotal,
                    description: `POS Satışı (${paymentMode === 'credit_card' ? 'Kredi Kartı' : paymentMode === 'account' ? 'Cari Hesap' : 'Nakit'}): ${orderNumber} | REF:${order.id}`,
                    kasaId: targetKasaId,
                    customerId: customerId || null
                }
            });

            // E. Update Customer Balance (Only for ACCOUNT/VERESIYE sales)
            if (customerId && paymentMode === 'account') {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { increment: finalTotal } }
                });
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
        console.error('Sale Create Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Satış kaydedilemedi.' },
            { status: 500 }
        );
    }
}
