import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    // RBAC Check for Admin Access
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const bodyJSON = await req.json();
        const { body, isInternal, statusChange } = bodyJSON;

        if (!body) {
            return NextResponse.json({ error: 'Mesaj boş bırakılamaz' }, { status: 400 });
        }

        const ticketId = params.id;
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                body,
                authorType: 'ADMIN',
                authorId: session.id || 'admin',
                isInternal: Boolean(isInternal),
            }
        });

        // Determine new status
        let newStatus = ticket.status;
        if (statusChange) {
            newStatus = statusChange;
        } else if (!isInternal) {
            // Automatically switch to WAITING_CUSTOMER if not internal note
            newStatus = 'WAITING_CUSTOMER';
        }

        if (newStatus !== ticket.status) {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: newStatus as any }
            });
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("Admin Ticket Reply Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
