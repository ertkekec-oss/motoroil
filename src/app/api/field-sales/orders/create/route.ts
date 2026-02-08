
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

        // Create SalesOrder
        const order = await (prisma as any).salesOrder.create({
            data: {
                companyId: company.id,
                customerId,
                staffId: visit.staffId,
                visitId,
                totalAmount: total,
                status: 'PENDING',
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

        return NextResponse.json({ success: true, orderId: order.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
