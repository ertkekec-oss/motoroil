import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 });
        }

        const ctx = await getRequestContext(req as any);
        if (!ctx.companyId) {
            return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id, companyId: ctx.companyId }
            });

            if (!order) {
                throw new Error('Sipariş bulunamadı.');
            }

            // Only release reserved stock if we are REJECTING a B2B order that was in PENDING_APPROVAL
            if (status === 'REJECTED' && order.status === 'PENDING_APPROVAL' && order.marketplace === 'B2B_NETWORK') {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                const targetBranch = order.branch || 'Merkez';

                for (const it of items) {
                    if (it.productId) {
                        const qty = Number(it.qty || it.quantity || 1);
                        
                        // Decrement reservedStock
                        await tx.stock.updateMany({
                            where: { productId: String(it.productId), branch: targetBranch },
                            data: { reservedStock: { decrement: qty } }
                        });

                        // Legacy / Global reference if Merkez
                        if (targetBranch === 'Merkez') {
                            await tx.product.updateMany({
                                where: { id: String(it.productId) },
                                data: { reservedStock: { decrement: qty } }
                            });
                        }
                    }
                }
            }

            let syncData: any = {};
            if (status === 'APPROVED' && order.marketplace === 'B2B_NETWORK') {
                let customer = await tx.customer.findFirst({
                    where: {
                        companyId: order.companyId,
                        OR: [
                            ...(order.customerEmail ? [{ email: order.customerEmail }] : []),
                            { name: order.customerName }
                        ]
                    }
                });

                if (!customer) {
                    customer = await tx.customer.create({
                        data: {
                            companyId: order.companyId,
                            name: order.customerName || 'B2B Müşterisi',
                            email: order.customerEmail || '',
                            phone: '',
                            balance: 0
                        }
                    });
                }

                let rawData = {};
                try {
                    rawData = typeof order.rawData === 'string' ? JSON.parse(order.rawData) : (order.rawData || {});
                } catch (e) {}
                (rawData as any).customerId = customer.id;

                syncData = {
                    customerName: customer.name,
                    customerEmail: customer.email,
                    customerId: customer.id,
                    rawData: rawData as any
                };
            }

            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status, ...syncData }
            });

            return updatedOrder;
        });

        return NextResponse.json({ success: true, order: result });

    } catch (error: any) {
        console.error('[ORDER_STATUS_ERROR]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
