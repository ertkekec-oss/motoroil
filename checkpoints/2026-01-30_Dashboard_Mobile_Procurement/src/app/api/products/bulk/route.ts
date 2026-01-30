
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { ids, updates, mode, individualUpdates } = body;

        if (mode === 'category') {
            await prisma.product.updateMany({
                where: { id: { in: ids } },
                data: { category: updates.category }
            });
        } else if (mode === 'vat') {
            await prisma.product.updateMany({
                where: { id: { in: ids } },
                data: {
                    salesVat: updates.salesVat,
                    purchaseVat: updates.purchaseVat
                }
            });
        } else if (mode === 'barcode' || mode === 'price') {
            // For individual updates, we need to loop
            // Note: In production this should be a transaction
            for (const id in individualUpdates) {
                await prisma.product.update({
                    where: { id },
                    data: individualUpdates[id]
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
