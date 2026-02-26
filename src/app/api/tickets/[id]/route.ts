import { NextRequest, NextResponse } from 'next/server';
import { requireTicketAccess } from '../../../../services/tickets/guards';
import { getTicketDetails, changeTicketStatus } from '../../../../services/tickets/ticketService';
import { TicketStatus } from '@prisma/client';

interface Params {
    params: { id: string };
}

export async function GET(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const { tenantId, isPlatformAdmin } = await requireTicketAccess(req);
        const ticket = await getTicketDetails(params.id, tenantId, isPlatformAdmin);
        return NextResponse.json(ticket);
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        if (e.message === 'Not Found') return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Partial update, mainly for Status right now
export async function PATCH(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const { tenantId, isPlatformAdmin } = await requireTicketAccess(req);
        const body = await req.json();

        if (body.status) {
            const updated = await changeTicketStatus(params.id, tenantId, body.status as TicketStatus, isPlatformAdmin);
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'No actionable update' }, { status: 400 });
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
