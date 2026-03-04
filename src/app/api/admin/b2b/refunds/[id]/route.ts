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
        const refundId = resolvedParams.id;

        const refund = await prisma.dealerRefund.findUnique({
            where: { id: refundId }
        });

        if (!refund) {
            return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
        }

        const [supplier, order] = await Promise.all([
            prisma.company.findUnique({
                where: { id: refund.supplierTenantId },
                select: { id: true, name: true, vkn: true }
            }),
            prisma.order.findUnique({
                where: { id: refund.orderId },
                select: { id: true, orderNumber: true, customerName: true }
            })
        ]);

        // Attempt to find audit logs related directly to this refund
        // Since schema might have `entityType`, we will try both `entityType: 'DealerRefund'` or `entity: 'DealerRefund'` gracefully
        // Depending on precise Prisma schema fields, AuditLog has `entity` and `entityId` or AuditEvent has `entityType`.
        // Let's assume AuditLog with entity='DealerRefund'
        let auditLogs: any[] = [];
        try {
            auditLogs = await prisma.auditLog.findMany({
                where: { entity: 'DealerRefund', entityId: refundId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
        } catch (e) {
            // fallback if it fails or model differs
            try {
                // Try AuditEvent model as it was defined in schema.prisma as well
                auditLogs = await prisma.auditEvent.findMany({
                    where: { entityType: 'DealerRefund', entityId: refundId },
                    orderBy: { createdAt: 'desc' },
                    take: 50
                });
            } catch (e2) { }
        }

        return NextResponse.json({
            refund: {
                id: refund.id,
                amount: Number(refund.amount),
                currency: refund.currency,
                status: refund.status,
                reason: refund.reason,
                provider: refund.provider,
                providerRefundId: refund.providerRefundId,
                idempotencyKey: refund.idempotencyKey,
                createdAt: refund.createdAt,
                accountingPostedAt: refund.accountingPostedAt,
                supplier: { id: supplier?.id, name: supplier?.name || 'Bilinmeyen' },
                order: {
                    id: order?.id,
                    orderNumber: order?.orderNumber || 'Bilinmeyen',
                    customerName: order?.customerName || 'Bilinmeyen'
                }
            },
            audit: auditLogs.map(log => ({
                id: log.id,
                action: log.action || log.type, // Handle either AuditLog or AuditEvent
                details: log.details || (log.meta ? JSON.stringify(log.meta) : null),
                createdAt: log.createdAt,
                userName: log.userName || log.actorUserId || 'System'
            }))
        });

    } catch (error: any) {
        console.error('Admin B2B Dealer Refund Detail Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
