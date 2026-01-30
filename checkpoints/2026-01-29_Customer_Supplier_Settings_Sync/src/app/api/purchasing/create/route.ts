
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { supplierId, invoiceNo, invoiceDate, items, totalAmount } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase Invoice
            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNo,
                    invoiceDate: new Date(invoiceDate),
                    amount: totalAmount,
                    totalAmount: totalAmount, // Simplification
                    supplierId,
                    items: items as any,
                    status: 'Bekliyor'
                }
            });

            // 2. Update Product Stocks
            // Note: In a real system we'd match exact product IDs. 
            // Here we assume items might have productId or we search by name/code.
            for (const item of items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.qty }, buyPrice: item.price }
                    });
                }
            }

            // 3. Update Supplier Balance
            // balance negative means we owe them.
            await tx.supplier.update({
                where: { id: supplierId },
                data: { balance: { decrement: totalAmount } }
            });

            return invoice;
        });

        return NextResponse.json({ success: true, invoiceId: result.id });
    } catch (error: any) {
        console.error('Purchasing Create Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
