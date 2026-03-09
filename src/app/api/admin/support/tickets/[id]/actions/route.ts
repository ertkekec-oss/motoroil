import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { SupportTicketService } from '@/services/support/SupportTicketService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    try {
        const body = await req.json();
        const { action, status, message, assignedToUserId } = body;

        const ticket = await SupportTicketService.getTicketById(id);
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        if (action === 'STATUS_CHANGE') {
            await SupportTicketService.updateTicketStatus(id, status, 'ADMIN');
        }

        if (action === 'ASSIGN') {
            await SupportTicketService.assignTicket(id, assignedToUserId);
        }

        if (action === 'ADD_COMMENT') {
            await SupportTicketService.addComment({
                ticketId: id,
                userId: auth.user!.id,
                message,
                authorType: 'ADMIN'
            });
            // Optionally transition status to IN_PROGRESS explicitly when admin replies if it was waiting
            await SupportTicketService.updateTicketStatus(id, 'WAITING_USER', 'ADMIN');
        }

        const updatedTicket = await SupportTicketService.getTicketById(id);
        return NextResponse.json({ success: true, ticket: updatedTicket });

    } catch (error: any) {
        console.error('Admin Ticket Action Error:', error);
        return NextResponse.json({ error: error.message || 'Action failed.' }, { status: 500 });
    }
}
