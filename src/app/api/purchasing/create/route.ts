import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { recordMovement } from '@/lib/inventory';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'purchasing_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { supplierId, invoiceNo, invoiceDate, items, totalAmount } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase Invoice
            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNo,
                    invoiceDate: new Date(invoiceDate),
                    amount: totalAmount,
                    totalAmount: totalAmount,
                    supplierId,
                    items: items as any,
                    status: 'Bekliyor'
                }
            });

            // 2. Update Product Stocks & Record Movements
            for (const item of items) {
                if (item.productId) {
                    const branch = session.branch || 'Merkez';

                    // Update Product table
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.qty }, buyPrice: item.price }
                    });

                    // Record FIFO Movement
                    await (tx as any).stockMovement.create({
                        data: {
                            productId: item.productId,
                            branch: branch as string,
                            quantity: item.qty,
                            price: item.price,
                            type: 'PURCHASE',
                            referenceId: invoice.id
                        }
                    });

                    // Update Stock table (branch specific)
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: item.productId, branch: branch as string } },
                        update: { quantity: { increment: item.qty } },
                        create: { productId: item.productId, branch: branch as string, quantity: item.qty }
                    });
                }
            }

            // 3. Create Financial Transaction (for tracking in Finansal Hareketler)
            const transaction = await tx.transaction.create({
                data: {
                    type: 'Purchase',
                    amount: totalAmount,
                    description: `Alış Faturası: ${invoiceNo} - ${(await tx.supplier.findUnique({ where: { id: supplierId } }))?.name || 'Tedarikçi'}`,
                    kasaId: null, // Alış genelde vadeli, ödeme ayrı yapılır
                    supplierId: supplierId,
                    branch: session.branch as string || 'Merkez'
                }
            });

            // 4. Update Supplier Balance
            await tx.supplier.update({
                where: { id: supplierId },
                data: { balance: { decrement: totalAmount } }
            });

            // 5. Log Activity
            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'CREATE',
                entity: 'PurchaseInvoice',
                entityId: invoice.id,
                newData: invoice,
                details: `${invoiceNo} numaralı alış faturası işlendi.`,
                branch: session.branch as string
            });

            return { invoice, transaction };
        });

        // Create Accounting Journal Entry (in background, non-blocking)
        (async () => {
            try {
                const { createJournalFromTransaction } = await import('@/lib/accounting');
                await createJournalFromTransaction(result.transaction);
            } catch (err) {
                console.error('[Muhasebe Entegrasyon Hatası - Alış]:', err);
            }
        })();

        return NextResponse.json({ success: true, invoiceId: result.invoice.id });
    } catch (error: any) {
        console.error('Purchasing Create Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
