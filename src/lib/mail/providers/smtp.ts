import { MailPayload, MailProvider } from "../index";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export class SmtpMailProvider implements MailProvider {
    name = 'SMTP';

    async send(payload: MailPayload): Promise<{ messageId?: string; error?: string }> {
        try {
            let settings = null;

            if (payload.companyId) {
                settings = await prisma.appSettings.findUnique({
                    where: {
                        companyId_key: {
                            companyId: payload.companyId,
                            key: 'smtp_settings'
                        }
                    }
                });
            }

            if (!settings || !settings.value) {
                // Fallback to first available SMTP settings in the database (acts as a global/system sender)
                settings = await prisma.appSettings.findFirst({
                    where: { key: 'smtp_settings' }
                });
            }

            let email = process.env.SMTP_EMAIL || 'info@periodya.com';
            let password = process.env.SMTP_PASSWORD || 'ezgf kvdd mact qtcd';
            let senderName = 'Periodya B2B Network';

            if (settings && settings.value) {
                const config = settings.value as any;
                if (config.email && config.password) {
                    email = config.email;
                    password = config.password;
                    if (config.senderName) senderName = config.senderName;
                }
            }

            if (!email || !password) {
                return { error: 'SMTP email veya şifre eksik.' };
            }

            const isGmail = email.toLowerCase().includes('gmail.com') || email.toLowerCase().includes('periodya.com');
            const domain = email.split('@')[1];

            const transportOptions: any = {
                host: isGmail ? 'smtp.gmail.com' : (domain ? `smtp.${domain}` : 'smtp.gmail.com'),
                port: isGmail ? 587 : 465,
                secure: !isGmail,
                auth: {
                    user: email,
                    pass: password.replace(/\s/g, '')
                },
                tls: {
                    rejectUnauthorized: false
                }
            };

            if (isGmail) {
                transportOptions.service = 'gmail';
                transportOptions.secure = false;
            }

            const transporter = nodemailer.createTransport(transportOptions);

            const mailOptions = {
                from: `"${senderName}" <${email}>`,
                to: payload.to,
                cc: payload.cc,
                bcc: payload.bcc,
                subject: payload.subject,
                html: payload.html,
                text: payload.text
            };

            const info = await transporter.sendMail(mailOptions);
            return { messageId: info.messageId };
        } catch (error: any) {
            console.error('[SMTP_MAIL_PROVIDER] Error:', error);
            return { error: error.message || 'E-posta gönderimi başarısız.' };
        }
    }
}
