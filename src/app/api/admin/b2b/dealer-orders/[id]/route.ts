import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.role?.toUpperCase() || '';
        if (!['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = (await Promise.resolve(params)) as any;
        const orderId = resolvedParams.id;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                company: { select: { name: true, vkn: true } }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const auditLogs = await prisma.auditLog.findMany({
            where: { entity: 'Order', entityId: orderId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                totalAmount: Number(order.totalAmount),
                currency: order.currency,
                createdAt: order.createdAt,
                supplier: { id: order.companyId, name: order.company?.name || 'Bilinmeyen Satıcı' },
                customerName: order.customerName,
                isLimitExceeded: order.isLimitExceeded,
                creditExceededAmount: order.creditExceededAmount ? Number(order.creditExceededAmount) : null,
                paymentRequired: order.paymentRequired
            },
            audit: auditLogs.map(log => ({
                id: log.id,
                action: log.action,
                details: log.details,
                createdAt: log.createdAt,
                userName: log.userName || 'System',
                after: log.after,
                before: log.before
            }))
        });

    } catch (error: any) {
        console.error('Admin B2B Dealer Order Detail Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
