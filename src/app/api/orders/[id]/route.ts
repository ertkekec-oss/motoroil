
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stornoJournalEntry } from '@/lib/accounting';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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

        const targetBranch = order.branch || 'Merkez';

        // Reversal logic for POS
        await prisma.$transaction(async (tx) => {
            // 1. Revert Stocks
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        const qty = Number(item.qty || item.quantity || 1);
                        try {
                            // Sync Stock Record (increment because we are returning items to shelf)
                            await tx.stock.upsert({
                                where: { productId_branch: { productId: String(item.productId), branch: targetBranch } },
                                update: { quantity: { increment: qty } },
                                create: { productId: String(item.productId), branch: targetBranch, quantity: qty }
                            });

                            // Create Stock Movement
                            await (tx as any).stockMovement.create({
                                data: {
                                    productId: String(item.productId),
                                    branch: targetBranch,
                                    companyId: order.companyId,
                                    quantity: qty,
                                    type: 'RETURN',
                                    referenceId: order.id,
                                    price: Number(item.price || 0)
                                }
                            });

                            // Revert Legacy field if Merkez
                            if (targetBranch === 'Merkez') {
                                await tx.product.update({
                                    where: { id: String(item.productId) },
                                    data: { stock: { increment: qty } }
                                });
                            }
                        } catch (e) {
                            console.error("Stock reversal error:", e);
                        }
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

                // SOFT DELETE Transaction
                await tx.transaction.update({
                    where: { id: t.id },
                    data: { deletedAt: new Date() }
                });
            }

            // 4. Handle Accounting Reversal (Storno)
            try {
                const journal = await tx.journal.findFirst({
                    where: { sourceId: id, sourceType: 'Order' }
                });
                if (journal) {
                    await stornoJournalEntry(journal.id, 'Satış İptal Edildi (POS)');
                }
            } catch (err) {
                console.error('[Accounting Reversal Error]:', err);
            }

            // 3. SOFT DELETE Order
            await tx.order.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: 'İptal Edildi'
                }
            });

            // AUDIT LOG
            const session = await getSession();
            if (session) {
                await logActivity({
                    tenantId: session.tenantId as string,
                    userId: session.id as string,
                    userName: session.username as string,
                    action: 'CANCEL_ORDER',
                    entity: 'Order',
                    entityId: id,
                    before: order,
                    details: `${order.orderNumber} nolu satış iptal edildi (Soft Delete).`,
                    userAgent: request.headers.get('user-agent') || undefined,
                    ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Order Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
