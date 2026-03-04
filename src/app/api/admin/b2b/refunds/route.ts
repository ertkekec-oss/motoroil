import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.role?.toUpperCase() || '';
        if (!['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');
        const status = searchParams.get('status') || 'ALL';
        const q = searchParams.get('q');

        const limit = 50;
        const where: any = {};

        if (tenantId) {
            where.supplierTenantId = tenantId;
        }

        if (status !== 'ALL') {
            // For Admin UI, PENDING / SUCCEEDED / FAILED mappings.
            where.status = status;
        }

        if (q) {
            where.OR = [
                { orderId: { contains: q, mode: 'insensitive' } },
                { providerRefundId: { contains: q, mode: 'insensitive' } },
                { idempotencyKey: { contains: q, mode: 'insensitive' } }
            ];
        }

        const refunds = await prisma.dealerRefund.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        // Resolve relations manually as DealerRefund might lack direct prisma @relation to Company/Order
        const supplierIds = Array.from(new Set(refunds.map((r: any) => r.supplierTenantId)));
        const orderIds = Array.from(new Set(refunds.map((r: any) => r.orderId)));

        const [suppliers, orders] = await Promise.all([
            prisma.company.findMany({
                where: { id: { in: supplierIds } },
                select: { id: true, name: true }
            }),
            prisma.order.findMany({
                where: { id: { in: orderIds } },
                select: { id: true, orderNumber: true, customerName: true }
            })
        ]);

        const supplierMap = new Map<string, any>(suppliers.map((s: any) => [s.id, s.name]));
        const orderMap = new Map<string, any>(orders.map((o: any) => [o.id, o]));

        const items = refunds.map((refund: any) => {
            const orderInfo = orderMap.get(refund.orderId);
            return {
                id: refund.id,
                supplier: { id: refund.supplierTenantId, name: supplierMap.get(refund.supplierTenantId) || 'Bilinmeyen' },
                order: {
                    id: refund.orderId,
                    orderNumber: orderInfo?.orderNumber || 'Bilinmeyen',
                    customerName: orderInfo?.customerName || 'Bilinmeyen'
                },
                provider: refund.provider,
                amount: Number(refund.amount),
                currency: refund.currency,
                status: refund.status,
                reason: refund.reason,
                createdAt: refund.createdAt,
                providerRefundId: refund.providerRefundId
            };
        });

        const totalCount = await prisma.dealerRefund.count({ where });

        return NextResponse.json({
            items,
            stats: {
                totalVisible: totalCount
            }
        });

    } catch (error: any) {
        console.error('Admin B2B Refunds Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
