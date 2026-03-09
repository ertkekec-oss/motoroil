import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { SupportTicketService } from '@/services/support/SupportTicketService';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    // Sadece yetkili adminler girebilir
    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as any;
        const priority = searchParams.get('priority') as any;
        const tenantId = searchParams.get('tenantId');
        const assignedTo = searchParams.get('assignedTo');

        const filters: any = {};
        if (status && status !== 'ALL') filters.status = status;
        if (priority && priority !== 'ALL') filters.priority = priority;
        if (tenantId) filters.tenantId = tenantId;
        if (assignedTo) filters.assignedToUserId = assignedTo;

        const tickets = await SupportTicketService.getTicketsForAdmin(filters);

        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        console.error('Fetch Admin Tickets Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin tickets.' }, { status: 500 });
    }
}
