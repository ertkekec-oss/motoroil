import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        const normalizedEmail = email?.toLowerCase().trim();

        if (!normalizedEmail) {
            return NextResponse.json({ error: 'E-Posta adresi gereklidir.' }, { status: 400 });
        }

        // 1. Search in Staff
        let targetUser = await (prisma as any).staff.findFirst({
            where: { email: normalizedEmail, deletedAt: null }
        });

        let type = 'STAFF';

        // 2. Search in User if not found in Staff
        if (!targetUser) {
            targetUser = await (prisma as any).user.findFirst({
                where: { email: normalizedEmail }
            });
            type = 'USER';
        }

        if (targetUser) {
            // Real Email Sending
            const siteUrl = process.env.NODE_ENV === 'production'
                ? 'https://periodya.com'
                : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

            // Simple token: In a production app, use a real signed/stored token!
            const resetLink = `${siteUrl}/reset-password?id=${targetUser.id}&token=${targetUser.id}&type=${type}`;

            const htmlBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #446ee7; margin: 0;">PERIOD<span style="color: #E64A00;">YA</span></h1>
                    </div>
                    <h2 style="color: #333; text-align: center;">Şifre Sıfırlama Talebi</h2>
                    <p>Sayın <b>${targetUser.name || 'Kullanıcı'}</b>,</p>
                    <p>Sistemiz üzerinden bir şifre sıfırlama talebinde bulundunuz. Devam etmek için aşağıdaki butona tıklayabilirsiniz:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background: #446ee7; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
                    </div>
                    <p style="font-size: 13px; color: #666;">Eğer bu butona tıklayamıyorsanız, aşağıdaki bağlantıyı tarayıcınıza yapıştırabilirsiniz:</p>
                    <p style="font-size: 12px; color: #446ee7; word-break: break-all;">${resetLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #999; text-align: center;">Eğer bu talebi siz yapmadıysanız, bu e-postayı güvenle silebilirsiniz.</p>
                </div>
             `;

            await sendMail({
                to: email,
                subject: '🔑 Periodya Şifre Sıfırlama Talebi',
                html: htmlBody,
                text: `Şifrenizi sıfırlamak için şu bağlantıyı kullanın: ${resetLink}`,
                companyId: targetUser.companyId
            });
        }

        // Return success always (for security)
        return NextResponse.json({ success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
    } catch (error: any) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
