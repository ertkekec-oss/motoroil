import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const body = await req.json();
        const { subject, description, priority, category, relatedHelpTopicId, metadata } = body;

        if (!subject || !description) {
            return NextResponse.json({ error: 'Konu ve açıklama zorunludur' }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                subject,
                description,
                priority: priority || 'P3_NORMAL',
                category: category || 'GENERAL',
                tenantId: session.tenantId,
                requesterUserId: session.id || session.user?.id || 'unknown',
                relatedHelpTopicId: relatedHelpTopicId || null,
                metadataJson: metadata || {},
                status: 'NEW',
            }
        });

        // Auto-reply for confirmation
        await prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                authorType: 'SYSTEM',
                authorId: 'SYSTEM',
                body: 'Talebiniz alınmıştır. Destek ekibimiz en kısa sürede sizinle iletişime geçecektir. Sabrınız için teşekkür ederiz.',
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error("Ticket Create Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
