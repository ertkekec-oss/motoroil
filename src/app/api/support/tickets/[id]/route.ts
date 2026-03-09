import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { SupportTicketService } from '@/services/support/SupportTicketService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const ticketId = params.id;

    try {
        const ticket = await SupportTicketService.getTicketById(ticketId);

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
        }

        // Tenant Isolation Guard
        if (ticket.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Forbidden. Cross-tenant access denied.' }, { status: 403 });
        }

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error('Fetch Ticket Details Error:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket.' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const userId = auth.user?.id;
    const ticketId = params.id;

    try {
        const ticket = await SupportTicketService.getTicketById(ticketId);

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
        }

        // Tenant Isolation Guard
        if (ticket.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Forbidden. Cross-tenant access denied.' }, { status: 403 });
        }

        if (ticket.status === 'CLOSED') {
            return NextResponse.json({ error: 'Cannot comment on a closed ticket.' }, { status: 400 });
        }

        const { message } = await req.json();

        const comment = await SupportTicketService.addComment({
            ticketId,
            userId,
            message,
            authorType: 'USER'
        });

        return NextResponse.json({ success: true, comment });
    } catch (error: any) {
        console.error('Comment on Ticket Error:', error);
        return NextResponse.json({ error: 'Failed to add comment.' }, { status: 500 });
    }
}
