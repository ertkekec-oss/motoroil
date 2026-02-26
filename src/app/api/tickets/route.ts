import { NextRequest, NextResponse } from 'next/server';
import { requireTicketAccess } from '../../../services/tickets/guards';
import { getTickets, createTicket } from '../../../services/tickets/ticketService';
import { TicketPriority, TicketRelatedEntityType, TicketType } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const { tenantId, isPlatformAdmin } = await requireTicketAccess(req);

        const tickets = await getTickets(tenantId, isPlatformAdmin);
        return NextResponse.json({ data: tickets });
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { tenantId, isPlatformAdmin, userId } = await requireTicketAccess(req);

        const body = await req.json();
        const { counterpartyTenantId, type, relatedEntityType, relatedEntityId, priority, initialMessage } = body;

        if (!type || !relatedEntityType || !relatedEntityId || !priority || !initialMessage) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
        }

        const ticket = await createTicket(
            tenantId,
            counterpartyTenantId || null,
            type as TicketType,
            relatedEntityType as TicketRelatedEntityType,
            relatedEntityId,
            priority as TicketPriority,
            initialMessage,
            userId
        );

        return NextResponse.json(ticket);
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
