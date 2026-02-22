import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const body = await req.json();
        const { subject, description, priority, category, relatedHelpTopicId, metadata, attachments } = body;

        if (!subject || !description) {
            return NextResponse.json({ error: 'Konu ve açıklama zorunludur' }, { status: 400 });
        }

        const userId = session.id || session.user?.id || 'unknown';

        const ticket = await prisma.ticket.create({
            data: {
                subject,
                description,
                priority: priority || 'P3_NORMAL',
                category: category || 'GENERAL',
                tenantId: session.tenantId,
                requesterUserId: userId,
                relatedHelpTopicId: relatedHelpTopicId || null,
                metadataJson: metadata || {},
                status: 'NEW',
                attachments: attachments ? {
                    create: attachments.map((att: any) => ({
                        fileKey: att.fileKey,
                        fileName: att.fileName,
                        mimeType: att.mimeType,
                        size: att.size
                    }))
                } : undefined
            }
        });

        // Auto-reply for confirmation in DB
        await prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                authorType: 'SYSTEM',
                authorId: 'SYSTEM',
                body: 'Talebiniz alınmıştır. Destek ekibimiz en kısa sürede sizinle iletişime geçecektir. Sabrınız için teşekkür ederiz.',
            }
        });

        // Background Email Sending (Fire and forget so it doesn't block the UI)
        prisma.user.findUnique({ where: { id: userId } }).then((user) => {
            if (user && user.email) {
                sendMail({
                    to: user.email,
                    subject: `[Periodya Destek] Talebiniz Alındı (#${ticket.ticketNumber})`,
                    html: `
                        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #FF5500;">Destek Talebiniz Bize Ulaştı</h2>
                            <p>Merhaba ${user.name || 'Değerli Kullanıcımız'},</p>
                            <p><strong>#${ticket.ticketNumber}</strong> numaralı destek talebiniz başarıyla oluşturuldu.</p>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <strong>Konu:</strong> ${subject}<br/>
                                <strong>Kategori:</strong> ${category}<br/>
                                <strong>Öncelik:</strong> ${priority}
                            </div>
                            <p>Destek ekibimiz en kısa sürede talebinizi inceleyip size dönüş yapacaktır.</p>
                            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com'}/support/${ticket.id}" style="display: inline-block; padding: 10px 20px; background: #FF5500; color: white; text-decoration: none; border-radius: 5px;">Talebi Görüntüle</a></p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
                            <p style="font-size: 12px; color: #999;">Bu email Periodya Destek Sistemi tarafından otomatik olarak gönderilmiştir.</p>
                        </div>
                    `
                }).catch(err => console.error("Kullanıcı e-postası gönderilemedi", err));
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        console.error("Ticket Create Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
