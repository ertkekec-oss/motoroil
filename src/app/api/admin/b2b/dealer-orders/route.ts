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
        const tenantId = searchParams.get('tenantId'); // Normalizing supplier context to companyId
        const status = searchParams.get('status') || 'ALL';
        const minTotal = searchParams.get('minTotal');
        const anomalyOnly = searchParams.get('anomalyOnly') === 'true';
        const q = searchParams.get('q');

        const limit = 50;
        const where: any = {};

        // 1) Tenant Filter Normalization
        if (tenantId) {
            where.companyId = tenantId;
        }

        // 2) Status Mapping (UI Enum -> DB Enum)
        if (status !== 'ALL') {
            if (status === 'PENDING') {
                where.status = { in: ['PENDING_APPROVAL', 'PAID_PENDING_APPROVAL', 'PENDING'] };
            } else if (status === 'APPROVED') {
                where.status = 'APPROVED';
            } else if (status === 'REFUND_REQUESTED') {
                // Requires refund logic or mapping, assuming REFUND_PENDING or similar for now
                where.status = 'REFUND_PENDING'; // Adjust based on actual app status constants
            } else if (['ESCROW', 'SHIPPED', 'COMPLETED'].includes(status)) {
                // Return 0 results for Escrow/Shipped/Completed in this version as per spec
                where.status = 'NOT_AVAILABLE_IN_DEALER_NETWORK';
            }
        }

        // 3) Search Query
        if (q) {
            where.OR = [
                { orderNumber: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } }
            ];
        }

        // 4) Min Total Filter
        if (minTotal && !isNaN(Number(minTotal))) {
            where.totalAmount = { gte: Number(minTotal) };
        }

        // 5) Anomaly Filter
        if (anomalyOnly) {
            const anomalousLogs = await prisma.auditLog.findMany({
                where: {
                    entity: 'Order',
                    action: { in: ['SUSPICIOUS_ORDER', 'CREDIT_LIMIT_EXCEEDED', 'PAYMENT_FAILED_REPLAY', 'ESCROW_DISPUTE'] }
                },
                select: { entityId: true },
                distinct: ['entityId']
            });

            const anomalousOrderIds = anomalousLogs.map(l => l.entityId).filter(Boolean) as string[];
            where.id = { in: anomalousOrderIds };
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                company: { select: { name: true } }
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        // Mapping to Admin UI expected format
        const items = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            supplier: { id: order.companyId, name: order.company?.name || 'Bilinmeyen Satıcı' },
            customerName: order.customerName,
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
            status: order.status,
            createdAt: order.createdAt,
            marketplace: order.marketplace,
            isLimitExceeded: order.isLimitExceeded
        }));

        const totalCount = await prisma.order.count({ where });

        return NextResponse.json({
            items,
            stats: {
                totalVisible: totalCount
            }
        });

    } catch (error: any) {
        console.error('Admin B2B Dealer Orders Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
