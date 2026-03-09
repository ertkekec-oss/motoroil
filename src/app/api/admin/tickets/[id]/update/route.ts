import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status, priority } = body;
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;

        const ticket = await prisma.ticket.update({
            where: { id },
            data: updateData
        });

        // Note: system messages for updates can be added here if needed, but we removed assignment tracking.

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error("Admin Ticket Update Error:", error);
        return NextResponse.json({ error: 'Güncelleme sırasında hata oluştu.' }, { status: 500 });
    }
}
