
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { visitId, customerId, items, total, notes } = body;

        if (!visitId || !customerId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
        }

        // Resolve Company ID (Platform Admin Support)
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        // Validate Visit
        const visit = await (prisma as any).salesVisit.findUnique({
            where: { id: visitId }
        });
        if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

        // Create SalesOrder and related entities in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const order = await (tx as any).salesOrder.create({
                data: {
                    companyId: company.id,
                    customerId,
                    staffId: visit.staffId,
                    visitId,
                    totalAmount: total,
                    status: 'COMPLETED', // default to completed as per user flow
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            productName: item.name || 'Unknown',
                            quantity: item.qty,
                            unitPrice: item.price,
                            totalPrice: item.qty * item.price
                        }))
                    },
                    notes
                }
            });

            // Update Customer Balance
            await tx.customer.update({
                where: { id: customerId },
                data: { balance: { increment: total } }
            });

            // Create Transaction Record for Cari Visibility
            await (tx as any).transaction.create({
                data: {
                    companyId: company.id,
                    customerId,
                    visitId,
                    type: 'SATIŞ',
                    amount: total,
                    description: `Saha Satışı - Sipariş No: ${order.id.substring(order.id.length - 6).toUpperCase()}`,
                    date: new Date(),
                    branch: visit.branch || 'Merkez'
                }
            });

            // Update Stocks
            for (const item of items) {
                if (item.productId) {
                    await (tx as any).stock.upsert({
                        where: {
                            productId_branch: {
                                productId: item.productId,
                                branch: visit.branch || 'Merkez'
                            }
                        },
                        update: { quantity: { decrement: item.qty } },
                        create: {
                            productId: item.productId,
                            branch: visit.branch || 'Merkez',
                            quantity: -item.qty
                        }
                    });

                    // Update Legacy Stock field
                    if (!visit.branch || visit.branch === 'Merkez') {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.qty } }
                        });
                    }
                }
            }

            return order;
        });

        return NextResponse.json({ success: true, orderId: result.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
