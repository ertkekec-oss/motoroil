import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, itemId: string }> }
) {
    try {
        const { id: serviceOrderId, itemId } = await params;

        const item = await prisma.serviceOrderItem.findUnique({
            where: { id: itemId }
        });

        if (!item || item.serviceOrderId !== serviceOrderId) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const totalPrice = Number(item.totalPrice);

        const [deletedItem, updatedOrder] = await prisma.$transaction([
            prisma.serviceOrderItem.delete({
                where: { id: itemId }
            }),
            prisma.serviceOrder.update({
                where: { id: serviceOrderId },
                data: {
                    totalAmount: { decrement: totalPrice },
                    subTotal: { decrement: totalPrice }
                }
            })
        ]);

        return NextResponse.json({ success: true, deletedItem });
    } catch (error: any) {
        console.error('Delete item error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
