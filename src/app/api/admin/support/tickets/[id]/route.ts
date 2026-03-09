import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { SupportTicketService } from '@/services/support/SupportTicketService';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    try {
        const ticket = await SupportTicketService.getTicketById(id);
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error('Fetch Admin Ticket Detail Error:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket detail.' }, { status: 500 });
    }
}
