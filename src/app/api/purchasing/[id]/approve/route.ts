
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await context.params;

        // Find the invoice (id might be invoiceNo or record id)
        const invoice = await prisma.purchaseInvoice.findFirst({
            where: {
                OR: [
                    { id: id },
                    { invoiceNo: id }
                ]
            },
            include: { supplier: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 });
        }

        if (invoice.status === 'Onaylandı') {
            return NextResponse.json({ success: false, error: 'Bu fatura zaten onaylanmış.' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Mark as Approved
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id: invoice.id },
                data: {
                    status: 'Onaylandı'
                }
            });

            // 2. Update Stocks & Record Movements
            const items = invoice.items as any[];
            const branch = session.branch || 'Merkez';

            for (const item of items) {
                if (item.productId) {
                    // Update Product table
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.qty },
                            buyPrice: item.price // Update last buy price
                        }
                    });

                    // Update Stock table (branch specific)
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: item.productId, branch: branch as string } },
                        update: { quantity: { increment: item.qty } },
                        create: { productId: item.productId, branch: branch as string, quantity: item.qty }
                    });

                    // Record FIFO Movement
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            branch: branch as string,
                            quantity: item.qty,
                            price: item.price,
                            type: 'PURCHASE',
                            referenceId: invoice.id
                        }
                    });
                }
            }

            // 3. Update Supplier Balance
            await tx.supplier.update({
                where: { id: invoice.supplierId },
                data: { balance: { decrement: invoice.totalAmount } }
            });

            // 4. Create Financial Transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'Purchase',
                    amount: invoice.totalAmount,
                    description: `Alış Faturası Onayı: ${invoice.invoiceNo} - ${invoice.supplier.name}`,
                    supplierId: invoice.supplierId,
                    branch: branch as string
                }
            });

            return { updatedInvoice, transaction };
        });

        return NextResponse.json({ success: true, message: 'Fatura kabul edildi ve stoklara işlendi.' });
    } catch (error: any) {
        console.error('Purchase Approve Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
