import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const bodyJSON = await req.json();
        const { body, attachments } = bodyJSON;

        if (!body) {
            return NextResponse.json({ error: 'Mesaj boş bırakılamaz' }, { status: 400 });
        }

        const ticketId = params.id;

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });

        // User can only reply to their own tenant's ticket
        if (session.role === 'USER') {
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

        // Check if admin is replying (Support Agent acting like a customer or something, but realistically Customer acts here)
        const isAdminReplying = session.role === 'SUPER_ADMIN' || session.role === 'SUPPORT_AGENT';

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                body,
                authorType: isAdminReplying ? 'ADMIN' : 'CUSTOMER',
                authorId: session.id || 'unknown',
                attachments: attachments ? {
                    create: attachments.map((att: any) => ({
                        fileKey: att.fileKey,
                        fileName: att.fileName,
                        mimeType: att.mimeType,
                        size: att.size,
                        ticketId: ticketId
                    }))
                } : undefined
            }
        });

        // Update ticket status
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: isAdminReplying ? 'WAITING_CUSTOMER' : 'NEW',
            }
        });

        // NOTE: Send Email to Support Staff (Fire & Forget)
        if (!isAdminReplying) {
            // Get user to provide full name contextual logic
            prisma.user.findUnique({ where: { id: session.id } }).then(async (user) => {
                const supportEmail = process.env.SUPPORT_EMAIL || 'destek@periodya.com'; // Admin mailbox
                const userName = user?.name || session.username || 'Müşteri';

                try {
                    await sendMail({
                        to: supportEmail,
                        subject: `[Destek Sistemi] Yeni Yanıt Geldi (#${ticket.ticketNumber})`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; background: #fafafa;">
                                <h3 style="color: #ff5500;">Bilete Yeni Yanıt: <strong>#${ticket.ticketNumber}</strong></h3>
                                <p><strong>Tenant:</strong> ${ticket.tenantId}</p>
                                <p><strong>Gönderen:</strong> ${userName}</p>
                                <div style="background: white; padding: 15px; border-left: 3px solid #ccc; margin: 15px 0;">
                                    ${body}
                                </div>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com'}/admin/support/tickets/${ticket.id}" 
                                   style="display: inline-block; padding: 10px; background: #333; color: #fff; text-decoration: none; border-radius: 4px;">
                                    Bilete Git (Yönetici)
                                </a>
                            </div>
                        `
                    });
                } catch (e) {
                    console.error("Admin'e e-posta gönderimi başarısız", e);
                }
            });
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("Ticket Reply Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
