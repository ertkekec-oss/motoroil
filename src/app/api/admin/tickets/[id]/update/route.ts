import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { assignedToUserId, tags, status, priority } = body;

        const updateData: any = {};
        if (assignedToUserId !== undefined) updateData.assignedToUserId = assignedToUserId;
        if (tags !== undefined) updateData.tags = tags;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;

        const ticket = await prisma.ticket.update({
            where: { id: params.id },
            data: updateData
        });

        // Add a system message about the change
        if (assignedToUserId) {
            await prisma.ticketMessage.create({
                data: {
                    ticketId: params.id,
                    authorType: 'SYSTEM',
                    authorId: 'SYSTEM',
                    body: `Bu talep şuraya atandı: ${assignedToUserId}`,
                    isInternal: true // Assignment change is internal info
                }
            });
        }

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error("Admin Ticket Update Error:", error);
        return NextResponse.json({ error: 'Güncelleme sırasında hata oluştu.' }, { status: 500 });
    }
}
