import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    // RBAC Check for Admin Access
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const bodyJSON = await req.json();
        const { body, isInternal, statusChange, attachments } = bodyJSON;

        if (!body) {
            return NextResponse.json({ error: 'Mesaj boş bırakılamaz' }, { status: 400 });
        }

        const ticketId = id;
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { relatedHelpTopic: true }
        });

        if (!ticket) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                body,
                authorType: 'ADMIN',
                authorId: session.id || 'admin',
                isInternal: Boolean(isInternal),
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

        // Determine new status
        let newStatus = ticket.status;
        if (statusChange) {
            newStatus = statusChange;
        } else if (!isInternal) {
            // Automatically switch to WAITING_CUSTOMER if not internal note
            newStatus = 'WAITING_CUSTOMER';

            // IF it is an external message, alert the user via Email (Fire & Forget)
            prisma.user.findUnique({ where: { id: ticket.requesterUserId } }).then((user) => {
                if (user && user.email) {
                    sendMail({
                        to: user.email,
                        subject: `[Periodya Destek] Talebinize Yanıt Verildi (#${ticket.ticketNumber})`,
                        html: `
                            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                                <h2 style="color: #FF5500;">Destek Talebinize Yanıt Verildi</h2>
                                <p>Merhaba ${user.name || 'Değerli Kullanıcımız'},</p>
                                <p><strong>#${ticket.ticketNumber}</strong> numaralı destek talebinize ("${ticket.subject}") destek ekibimiz tarafından bir yanıt eklendi.</p>
                                <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5500;">
                                    <p style="white-space: pre-wrap; font-size: 14px;">${body}</p>
                                </div>
                                <p>Talebe yanıt vermek veya detayları görüntülemek için aşağıdaki bağlantıya tıklayabilirsiniz:</p>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com'}/support/${ticket.id}" style="display: inline-block; padding: 10px 20px; background: #FF5500; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Talebi Görüntüle ve Yanıtla</a>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                                    Otomatik bilgilendirme mailidir. Lütfen bu maile direkt yanıt vermeyiniz.
                                </div>
                            </div>
                        `
                    }).catch(err => console.error("Admin Reply Error:", err));
                }
            });
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
