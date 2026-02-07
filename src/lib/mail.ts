import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export const sendMail = async ({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) => {
    // 1. SMTP Ayarlarını Veritabanından Çek
    let smtpConfig = {
        email: process.env.SMTP_EMAIL || 'motoroil.app.demo@gmail.com',
        password: process.env.SMTP_PASSWORD || ''
    };

    try {
        const dbSettings = await (prisma as any).appSettings.findUnique({
            where: { key: 'smtp_settings' }
        });

        if (dbSettings && dbSettings.value) {
            const val = dbSettings.value as any;
            if (val.email && val.password) {
                smtpConfig = {
                    email: val.email,
                    password: val.password.replace(/\s/g, '')
                };
            }
        }
    } catch (e) {
        console.warn("SMTP ayarları veritabanından çekilemedi, env kullanılıyor.", e);
    }

    if (!smtpConfig.email || !smtpConfig.password) {
        console.error("SMTP Configuration missing (email or password).");
        return { success: false, error: "SMTP settings not configured" };
    }

    // Determine service or host
    const isGmail = smtpConfig.email.includes('gmail.com') || smtpConfig.email.includes('periodya.com'); // periodya uses workspace possibly

    const transportOptions: any = {
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password.replace(/\s/g, '')
        }
    };

    if (isGmail) {
        transportOptions.service = 'gmail';
    } else {
        // Fallback or generic SMTP logic could go here
        // For now, let's keep it 'gmail' if we suspect Workspace, or try standard ports
        transportOptions.host = 'smtp.gmail.com';
        transportOptions.port = 465;
        transportOptions.secure = true;
    }

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        console.log(`Sending email to ${to} using ${smtpConfig.email}...`);

        const info = await transporter.sendMail({
            from: `"Periodya" <${smtpConfig.email}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        console.log("Email sent successfully: %s", info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error("CRITICAL MAIL ERROR:", error.message);
        if (error.code === 'EAUTH') {
            console.error("Authentication failed. Check your email and App Password.");
        }
        return { success: false, error: error.message };
    }
};
