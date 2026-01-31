import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'E-Posta adresi gereklidir.' }, { status: 400 });
        }

        const staff = await prisma.staff.findFirst({
            where: { email }
        });

        if (!staff) {
            // Security: Don't reveal if user exists or not, but for UX we might say "If registered..."
            // But here for simplicity we can just return success to avoid enumeration, or error if specifically internal tool.
            // Let's return success with a generic message.
            console.log(`Password reset requested for non-existent email: ${email}`);
        } else {
            // Real Email Sending
            const origin = request.headers.get('origin') || 'https://kech.tr';
            const resetLink = `${origin}/reset-password?id=${staff.id}&token=${staff.id}`; // Simple token for now

            const htmlBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">Şifre Sıfırlama Talebi</h2>
                    <p>Sayın <b>${staff.name}</b>,</p>
                    <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
                    <p>
                        <a href="${resetLink}" style="background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
                    </p>
                    <p style="font-size: 12px; color: #666; margin-top:20px;">Eğer bu talebi siz yapmadıysanız, dikkate almayınız.</p>
                </div>
             `;

            await sendMail({
                to: email,
                subject: 'Şifre Sıfırlama Talebi',
                html: htmlBody,
                text: `Şifrenizi sıfırlamak için şu bağlantıyı kullanın: ${resetLink}`
            });
        }

        return NextResponse.json({ success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
