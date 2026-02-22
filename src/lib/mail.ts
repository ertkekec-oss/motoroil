import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export const sendMail = async ({ to, subject, text, html, companyId }: { to: string, subject: string, text?: string, html?: string, companyId?: string }) => {
    // 1. SMTP Ayarlarını Belirle (Varsayılan ENV ayarları)
    let smtpConfig = {
        email: process.env.SMTP_EMAIL || 'info@periodya.com',
        password: process.env.SMTP_PASSWORD || 'ezgf kvdd mact qtcd'
    };

    // 2. Eğer companyId verilmişse o firmanın özel SMTP ayarlarını çek
    // 3. Eğer companyId yoksa veya ayar bulunamazsa, sistemdeki herhangi bir geçerli SMTP ayarını "Master" olarak kullanmayı dene
    try {
        let dbSettings = null;
        if (companyId) {
            dbSettings = await (prisma as any).appSettings.findUnique({
                where: {
                    companyId_key: {
                        companyId: companyId,
                        key: 'smtp_settings'
                    }
                }
            });
        }

        // Fallback to first available SMTP settings if none found for company
        if (!dbSettings) {
            dbSettings = await (prisma as any).appSettings.findFirst({
                where: { key: 'smtp_settings' }
            });
        }

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
        console.warn(`[MAILER] SMTP ayarları çekilemedi, varsayılan kullanılıyor.`, e);
    }

    if (!smtpConfig.email || !smtpConfig.password) {
        console.error("SMTP Configuration missing (email or password).");
        return { success: false, error: "SMTP settings not configured" };
    }

    // Determine service or host
    const isGmail = smtpConfig.email.toLowerCase().includes('gmail.com');

    const transportOptions: any = {
        host: isGmail ? 'smtp.gmail.com' : (smtpConfig.email.split('@')[1] ? `smtp.${smtpConfig.email.split('@')[1]}` : 'smtp.gmail.com'),
        port: 587,
        secure: false, // TLS
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password.replace(/\s/g, '')
        },
        tls: {
            rejectUnauthorized: false // Dev/Test friendly
        }
    };

    if (!smtpConfig.password) {
        console.warn("[MAILER] WARNING: SMTP Password is empty. Emails will likely fail.");
    }

    // If database settings explicitly provide host/port (extension for later), use them.
    // For now, let's optimize for Gmail which is the primary use case.
    if (isGmail) {
        transportOptions.service = 'gmail';
    } else {
        // More robust generic SMTP
        transportOptions.host = smtpConfig.email.split('@')[1] ? `smtp.${smtpConfig.email.split('@')[1]}` : 'smtp.gmail.com';
        transportOptions.port = 465;
        transportOptions.secure = true;
    }

    // FINAL CONFIG OVERRIDE: If the user provided a password, they likely want to use the mailer.
    // Let's ensure standard ports are tried if the above fails.

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        console.log(`[MAILER] Attempting to send email to ${to} via ${smtpConfig.email}...`);

        // Verify transport
        await transporter.verify();
        console.log("[MAILER] SMTP Connection verified.");

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
