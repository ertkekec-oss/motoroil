import { NextRequest, NextResponse } from 'next/server';
import { requireTicketAccess } from '../../../../../services/tickets/guards';
import { addTicketMessage } from '../../../../../services/tickets/ticketService';
import { TicketSenderRole } from '@prisma/client';

interface Params {
    params: { id: string };
}

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const { tenantId, isPlatformAdmin, role } = await requireTicketAccess(req);

        const body = await req.json();
        const { message } = body;

        let senderRole: TicketSenderRole = 'SELLER';
        if (isPlatformAdmin) {
            senderRole = 'PLATFORM_ADMIN';
        } else if (role === 'BUYER') {
            senderRole = 'BUYER';
        }

        if (!message) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        const msg = await addTicketMessage(
            params.id,
            tenantId,
            senderRole,
            message,
            isPlatformAdmin
        );

        return NextResponse.json(msg);
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        if (e.message === 'TICKET_NOT_FOUND') return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
