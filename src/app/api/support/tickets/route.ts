import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { SupportTicketService } from '@/services/support/SupportTicketService';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found.' }, { status: 400 });

    try {
        const tickets = await SupportTicketService.getTicketsByTenant(tenantId);
        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        console.error('Fetch Tickets Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const userId = auth.user?.id;
    if (!tenantId || !userId) return NextResponse.json({ error: 'Identity not found.' }, { status: 400 });

    try {
        const body = await req.json();
        const { subject, description, category, priority, currentPage, browserInfo } = body;

        const ticket = await SupportTicketService.createTicket({
            tenantId,
            createdByUserId: userId,
            subject,
            description,
            category,
            priority,
            currentPage,
            browserInfo,
            metadataJson: { source: 'USER_DASHBOARD' }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error('Create Ticket Error:', error);
        return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 });
    }
}
