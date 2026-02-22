import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLabelSignedUrl } from '@/lib/s3';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const attachment = await prisma.ticketAttachment.findUnique({
            where: { id: params.id },
            include: { ticket: true }
        });

        if (!attachment) return NextResponse.json({ error: 'Ek bulunamadı' }, { status: 404 });

        // Security: Ensure user belongs to the ticket's tenant
        if (session.role === 'USER') {
            if (attachment.ticket.tenantId !== session.tenantId || attachment.ticket.requesterUserId !== session.id) {
                return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
            }
        } else if (session.role === 'TENANT_ADMIN') {
            if (attachment.ticket.tenantId !== session.tenantId) {
                return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
            }
        }
        // Admin roles bypass tenant checks for support

        const url = await getLabelSignedUrl(attachment.fileKey, 3600); // 1 hour

        return NextResponse.json({ success: true, url });
    } catch (error: any) {
        console.error("Attachment Download Error:", error);
        return NextResponse.json({ error: 'Dosya bağlantısı alınamadı' }, { status: 500 });
    }
}
