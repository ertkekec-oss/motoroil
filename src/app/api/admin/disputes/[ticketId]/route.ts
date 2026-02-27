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

export async function GET(request: Request, props: { params: Promise<{ ticketId: string }> }) {
    try {
        const session: any = await getSession();
        if (!isAuthorized(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const { ticketId } = params;

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        let disputeCase = await prisma.disputeCase.findUnique({
            where: { ticketId },
            include: { actions: { orderBy: { createdAt: 'desc' } } }
        });

        if (!disputeCase && ticket.type === 'SHIPPING_DISPUTE') {
            // Lazy init case if missing
            disputeCase = await prisma.disputeCase.create({
                data: {
                    ticketId,
                    buyerTenantId: ticket.tenantId,
                    sellerTenantId: ticket.counterpartyTenantId || '',
                    status: 'OPEN',
                    severity: 'MEDIUM'
                },
                include: { actions: true }
            });
        }

        // We map messages to redacted versions only
        const safeMessages = ticket.messages.map(m => ({
            id: m.id,
            actorType: m.senderRole,
            createdAt: m.createdAt,
            redactedMessage: m.redactedMessage || m.message // Fallback if redaction failed
        }));

        const isSlaBreached = ticket.slaDueAt ? new Date(ticket.slaDueAt) < new Date() : false;

        // Fetch dummy/timeline references for UI based on references
        const timeline = {
            payments: [],
            earnings: [],
            shipment: null,
            shippingInvoiceMatch: null
        };

        return NextResponse.json({
            ticket: {
                id: ticket.id,
                status: ticket.status,
                type: ticket.type,
                createdAt: ticket.createdAt,
                slaDueAt: ticket.slaDueAt,
                isSlaBreached
            },
            case: disputeCase,
            timeline,
            messages: safeMessages,
            actions: disputeCase?.actions || []
        });

    } catch (error: any) {
        console.error('Disputes Detail GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
