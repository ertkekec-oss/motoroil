import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: serviceOrderId } = await params;
        const body = await request.json();
        const { name, quantity, unitPrice, type } = body;

        const totalPrice = Number(quantity) * Number(unitPrice);

        // Nested transaction: create item, update order total
        const [newItem, updatedOrder] = await prisma.$transaction([
            prisma.serviceOrderItem.create({
                data: {
                    serviceOrderId,
                    name,
                    quantity: new Prisma.Decimal(quantity),
                    unitPrice: new Prisma.Decimal(unitPrice),
                    totalPrice: new Prisma.Decimal(totalPrice),
                    type
                }
            }),
            prisma.serviceOrder.update({
                where: { id: serviceOrderId },
                data: {
                    totalAmount: { increment: totalPrice },
                    subTotal: { increment: totalPrice }
                    // assuming tax logic is simplified for now
                }
            })
        ]);

        return NextResponse.json(newItem);
    } catch (error: any) {
        console.error('Add item error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
