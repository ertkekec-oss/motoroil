
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const invoice = await prisma.salesInvoice.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 });
        }

        if (invoice.isFormal) {
            return NextResponse.json({ success: false, error: 'Bu fatura zaten onaylanmış.' }, { status: 400 });
        }

        // 1. Mark as Formal
        await prisma.salesInvoice.update({
            where: { id },
            data: {
                status: 'Onaylandı',
                isFormal: true
            }
        });

        // 2. Update Stocks
        const items = invoice.items as any[];
        const targetBranch = invoice.branch || 'Merkez';
        for (const item of items) {
            if (item.productId) {
                const qty = Number(item.qty || 1);

                // Update Stock table (branch specific)
                await prisma.stock.upsert({
                    where: { productId_branch: { productId: item.productId, branch: targetBranch } },
                    update: { quantity: { decrement: qty } },
                    create: { productId: item.productId, branch: targetBranch, quantity: -qty }
                });

                // Create Stock Movement
                await (prisma as any).stockMovement.create({
                    data: {
                        productId: item.productId,
                        branch: targetBranch,
                        companyId: invoice.companyId,
                        quantity: -qty,
                        type: 'SALE',
                        referenceId: invoice.id,
                        price: item.price || 0
                    }
                });

                // Sync Legacy Field if Merkez
                if (targetBranch === 'Merkez') {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: qty } }
                    }).catch(e => console.error(`Legacy stock sync failed for ${item.productId}`, e));
                }
            }
        }

        // 3. Update Customer Balance (Invoiced sale adds to customer debt)
        // In our system, positive balance usually means they owe us? 
        // Wait, schema says: balance Float @default(0)
        // Supplier says balance < 0 means we owe them.
        // Customer balance: positive usually means they owe us, negative means we owe them (overpayment/returns).
        await prisma.customer.update({
            where: { id: invoice.customerId },
            data: {
                balance: { increment: invoice.totalAmount }
            }
        });

        // 4. Create a Transaction record (optional, but good for history)
        // We need a Kasa for transaction. If not specified, use a default or none.
        // Since it's a "sale on account" (veresiye/faturalı), it doesn't necessarily hit a cashbox yet.
        // But the Transaction model requires kasaId. 
        // Maybe we have a "Cari Hesabı" kasa? No, let's just create a log or a specific transaction type.

        return NextResponse.json({ success: true, message: 'Fatura resmileştirildi ve stoklar güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
