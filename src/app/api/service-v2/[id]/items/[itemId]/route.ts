import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string, itemId: string } }) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const companyId = await resolveCompanyId(auth.user);

        const order = await prisma.serviceOrder.findUnique({
            where: { id: params.id, companyId }
        });
        if (!order) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 });

        await prisma.serviceOrderItem.deleteMany({
            where: {
                id: params.itemId,
                serviceOrderId: order.id
            }
        });

        // Recalculate totals
        const allItems = await prisma.serviceOrderItem.findMany({ where: { serviceOrderId: order.id } });
        const newTotal = allItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);
        const subTotal = newTotal / 1.20;
        const taxTotal = newTotal - subTotal;

        await prisma.serviceOrder.update({
            where: { id: order.id },
            data: {
                totalAmount: newTotal,
                subTotal: subTotal,
                taxTotal: taxTotal
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
