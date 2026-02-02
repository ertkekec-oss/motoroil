import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma'; // Ensure prisma is imported

export const sendMail = async ({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) => {
    // 1. SMTP Ayarlarını Veritabanından Çek
    let smtpConfig = {
        email: process.env.SMTP_EMAIL || 'motoroil.app.demo@gmail.com',
        password: process.env.SMTP_PASSWORD || 'demo_password_here'
    };

    try {
        const dbSettings = await prisma.appSettings.findUnique({
            where: { key: 'smtp_settings' }
        });

        if (dbSettings && dbSettings.value) {
            const val = dbSettings.value as any;
            if (val.email && val.password) {
                smtpConfig = {
                    email: val.email,
                    // Şifredeki boşlukları temizle (Google boşluklu verir ama protokol bitişik ister)
                    password: val.password.replace(/\s/g, '')
                };
            }
        }
    } catch (e) {
        console.warn("SMTP ayarları veritabanından çekilemedi, env kullanılıyor.", e);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password.replace(/\s/g, '') // Fallback için burada da temizle
        }
    });

    try {
        // 2. Maili Gönder
        const info = await transporter.sendMail({
            from: `"Periodya Sistem" <${smtpConfig.email}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        console.log("Mesaj gönderildi: %s", info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("Mail gönderme hatası:", error);
        return { success: false, error };
    }
};
