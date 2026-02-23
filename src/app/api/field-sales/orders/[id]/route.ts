
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const authResult = await authorize();
        if (!authResult.authorized) return authResult.response;
        const user = authResult.user;

        const body = await req.json();
        const { items, total, notes } = body;

        // 1. Find existing order
        const existingOrder = await (prisma as any).salesOrder.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        // 2. Transaction to reverse impact and re-apply
        await prisma.$transaction(async (tx) => {
            // Reverse balance impact
            await tx.customer.update({
                where: { id: existingOrder.customerId },
                data: { balance: { decrement: existingOrder.totalAmount } }
            });

            // Update Stock (reverse previous deduction)
            // Note: In a real system, we should precisely track which branch this was from.
            // Using a default of 'Merkez' or the one from visit if available.
            const visit = await (tx as any).salesVisit.findUnique({ where: { id: existingOrder.visitId } });
            const branch = visit?.branch || 'Merkez';

            for (const oldItem of existingOrder.items) {
                if (oldItem.productId) {
                    await (tx as any).stock.upsert({
                        where: { productId_branch: { productId: oldItem.productId, branch } },
                        update: { quantity: { increment: oldItem.quantity } },
                        create: { productId: oldItem.productId, branch, quantity: oldItem.quantity }
                    });
                }
            }

            // Delete old items
            await (tx as any).salesOrderItem.deleteMany({
                where: { salesOrderId: id }
            });

            // Apply new items and total
            await (tx as any).salesOrder.update({
                where: { id },
                data: {
                    totalAmount: total,
                    notes,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            productName: item.productName || item.name,
                            quantity: item.quantity || item.qty,
                            unitPrice: item.unitPrice || item.price,
                            totalPrice: (item.quantity || item.qty) * (item.unitPrice || item.price)
                        }))
                    }
                }
            });

            // Re-apply balance impact
            await tx.customer.update({
                where: { id: existingOrder.customerId },
                data: { balance: { increment: total } }
            });

            // Re-apply stock deduction
            for (const newItem of items) {
                const qty = newItem.quantity || newItem.qty;
                if (newItem.productId) {
                    await (tx as any).stock.upsert({
                        where: { productId_branch: { productId: newItem.productId, branch } },
                        update: { quantity: { decrement: qty } },
                        create: { productId: newItem.productId, branch, quantity: -qty }
                    });
                }
            }

            // Update Transaction record
            await (tx as any).transaction.updateMany({
                where: {
                    visitId: existingOrder.visitId,
                    customerId: existingOrder.customerId,
                    type: 'SATIŞ'
                },
                data: {
                    amount: total,
                    description: `Saha Satışı Düzeltme - Sipariş No: ${id.substring(id.length - 6).toUpperCase()}`
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Order update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
