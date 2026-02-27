import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isAuthorized(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' ||
        role === 'PLATFORM_ADMIN' ||
        role === 'PLATFORM_RISK_ADMIN' ||
        role === 'PLATFORM_FINANCE_ADMIN' ||
        tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isAuthorized(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');
        const sla = searchParams.get('sla');
        const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);
        // cursor pagination can be added here if needed, keeping it simple for now

        // We fetch tickets of type SHIPPING_DISPUTE (or others if added)
        // that have an associated DisputeCase.

        let whereClause: any = {
            type: 'SHIPPING_DISPUTE' // Replace with enum mapping if required
        };

        const disputeCaseWhere: any = {};
        if (status) disputeCaseWhere.status = status;
        if (severity) disputeCaseWhere.severity = severity;

        const now = new Date();
        if (sla === 'breached') {
            whereClause.slaDueAt = { lt: now };
        } else if (sla === 'dueSoon') {
            const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
            whereClause.slaDueAt = { gte: now, lte: soon };
        }

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            take,
            orderBy: { id: 'desc' },
            include: {
                // Since DisputeCase isn't directly related on Prisma schema yet, 
                // we'll fetch them manually below. If you defined relation, use `include`.
            }
        });

        // Fetch DisputeCases manually since relation wasn't explicitly defined in Ticket model
        const ticketIds = tickets.map(t => t.id);
        const cases = await prisma.disputeCase.findMany({
            where: {
                ticketId: { in: ticketIds },
                ...disputeCaseWhere
            }
        });

        const caseMap = new Map(cases.map(c => [c.ticketId, c]));

        // Filter tickets that match dispute filters
        let items = tickets.map(t => {
            const tCase = caseMap.get(t.id);
            if (Object.keys(disputeCaseWhere).length > 0 && !tCase) return null;

            return {
                ticketId: t.id,
                disputeCaseId: tCase?.id,
                status: tCase ? tCase.status : t.status,
                severity: tCase?.severity || 'LOW',
                slaDueAt: t.slaDueAt,
                isSlaBreached: t.slaDueAt ? new Date(t.slaDueAt) < now : false,
                type: t.type,
                createdAt: tCase?.createdAt || t.createdAt,
                updatedAt: tCase?.updatedAt || t.resolvedAt || t.createdAt,
                buyerTenantId: tCase?.buyerTenantId || t.tenantId, // fallback
                sellerTenantId: tCase?.sellerTenantId || t.counterpartyTenantId,
                referencedShipmentId: tCase?.referencedShipmentId,
                referencedOrderId: tCase?.referencedOrderId
            };
        }).filter(Boolean);

        return NextResponse.json({ items });
    } catch (error: any) {
        console.error('Disputes GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
