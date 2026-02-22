import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const bodyJSON = await req.json();
        const { body } = bodyJSON;

        if (!body) {
            return NextResponse.json({ error: 'Mesaj boş bırakılamaz' }, { status: 400 });
        }

        const ticketId = params.id;

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });

        // User can only reply to their own tenant's ticket
        if (session.role === 'USER') { // Actually verify tenant and ownership
            if (ticket.tenantId !== session.tenantId || ticket.requesterUserId !== session.id) {
                return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
            }
        } else if (session.role === 'TENANT_ADMIN') {
            if (ticket.tenantId !== session.tenantId) {
                return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
            }
        }

        if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
            return NextResponse.json({ error: 'Kapanmış bir talebe mesaj gönderemezsiniz.' }, { status: 400 });
        }

        // Check if admin is replying
        const isAdminReplying = session.role === 'SUPER_ADMIN' || session.role === 'SUPPORT_AGENT';

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                body,
                authorType: isAdminReplying ? 'ADMIN' : 'CUSTOMER',
                authorId: session.id || 'unknown',
            }
        });

        // Update ticket status
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: isAdminReplying ? 'WAITING_CUSTOMER' : 'NEW',
            }
        });

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("Ticket Reply Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
