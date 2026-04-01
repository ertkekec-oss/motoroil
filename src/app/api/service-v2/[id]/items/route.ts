import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const companyId = await resolveCompanyId(auth.user);
        
        const body = await request.json();
        const { type, name, quantity, unitPrice, technicianId, isWarrantyCovered, productId } = body;

        const order = await prisma.serviceOrder.findUnique({
            where: { id: params.id, companyId }
        });
        if (!order) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 });

        const total = isWarrantyCovered ? 0 : Number(quantity) * Number(unitPrice);

        const item = await prisma.serviceOrderItem.create({
            data: {
                serviceOrderId: order.id,
                productId: productId || null,
                type: type || 'PART',
                name: name || 'Yeni İslem',
                quantity: Number(quantity) || 1,
                unitPrice: Number(unitPrice) || 0,
                totalPrice: total,
                technicianId: technicianId || null,
                isWarrantyCovered: Boolean(isWarrantyCovered)
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

        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
