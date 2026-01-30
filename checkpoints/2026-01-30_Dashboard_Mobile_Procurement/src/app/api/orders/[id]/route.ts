
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        // Reversal logic for POS
        await prisma.$transaction(async (tx) => {
            // 1. Revert Stocks
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        try {
                            await tx.product.update({
                                where: { id: String(item.productId) },
                                data: { stock: { increment: Number(item.qty || item.quantity || 1) } }
                            });
                        } catch (e) { console.error("Stock reversal error:", e); }
                    }
                }
            }

            // 2. Revert Kasa & Financial Transaction
            // Find the transaction associated with this order (using REF:id in description)
            const transactions = await tx.transaction.findMany({
                where: {
                    description: { contains: `REF:${id}` }
                }
            });

            for (const t of transactions) {
                // Revert Kasa Balance
                if (t.type === 'Sales' || t.type === 'Collection') {
                    await tx.kasa.update({
                        where: { id: t.kasaId },
                        data: { balance: { decrement: t.amount } }
                    });
                }

                // Revert Customer Balance if it was an 'account' sale
                if (t.customerId && t.type === 'Sales') {
                    const rawData: any = order.rawData || {};
                    if (rawData.paymentMode === 'account') {
                        await tx.customer.update({
                            where: { id: t.customerId },
                            data: { balance: { decrement: t.amount } }
                        });
                    }
                }

                // Delete Transaction
                await tx.transaction.delete({ where: { id: t.id } });
            }

            // 3. Delete Order
            await tx.order.delete({ where: { id } });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Order Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
