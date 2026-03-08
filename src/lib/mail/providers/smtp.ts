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

            // Fallback is simply the ENV vars or hardcoded keys below.
            // We removed the findFirst fallback because it was grabbing random companies' invalid smtp settings.

            let email = process.env.SMTP_EMAIL || 'info@periodya.com';
            let password = process.env.SMTP_PASSWORD || 'qrqp zjoi lmor uhsz';
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

            try {
                const info = await transporter.sendMail(mailOptions);
                return { messageId: info.messageId };
            } catch (err: any) {
                // If custom tenant SMTP fails, attempt ultimate fallback to System ENV so critical emails aren't lost
                if (payload.companyId && settings && email !== process.env.SMTP_EMAIL) {
                    console.warn(`[SMTP_MAIL_PROVIDER] Tenant SMTP failed for company ${payload.companyId}. Falling back to system default. Error: ${err.message}`);

                    const fallbackEmail = process.env.SMTP_EMAIL || 'info@periodya.com';
                    const fallbackPassword = process.env.SMTP_PASSWORD || 'qrqp zjoi lmor uhsz';

                    const fallbackOptions: any = {
                        host: fallbackEmail.toLowerCase().includes('gmail.com') || fallbackEmail.toLowerCase().includes('periodya.com') ? 'smtp.gmail.com' : `smtp.${fallbackEmail.split('@')[1]}`,
                        port: 587,
                        secure: false,
                        auth: { user: fallbackEmail, pass: fallbackPassword.replace(/\s/g, '') },
                        tls: { rejectUnauthorized: false }
                    };

                    const fallbackTransporter = nodemailer.createTransport(fallbackOptions);
                    const fallbackMailOptions = {
                        ...mailOptions,
                        from: `"Periodya B2B Network" <${fallbackEmail}>`
                    };

                    const fallbackInfo = await fallbackTransporter.sendMail(fallbackMailOptions);
                    return { messageId: fallbackInfo.messageId };
                }
                throw err;
            }
        } catch (error: any) {
            console.error('[SMTP_MAIL_PROVIDER] Error:', error);
            return { error: error.message || 'E-posta gönderimi başarısız.' };
        }
    }
}
