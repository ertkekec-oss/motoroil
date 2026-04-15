import { MailPayload, MailProvider } from "../index";

export class ResendMailProvider implements MailProvider {
    name = 'RESEND';

    async send(payload: MailPayload): Promise<{ messageId?: string; error?: string }> {
        try {
            if (!process.env.RESEND_API_KEY) {
                throw new Error('Resend API Key is not configured.');
            }

            console.log(`[RESEND API] Sending email to ${payload.to}`);

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.MAIL_FROM || 'Periodya Enterprise <noreply@periodya.com>',
                    to: [payload.to],
                    subject: payload.subject,
                    html: payload.htmlBody || `<p>${payload.textBody || ''}</p>`,
                    text: payload.textBody
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Resend error');

            return { messageId: data.id };
        } catch (error: any) {
            return { error: error.message || 'Unknown Resend error' };
        }
    }
}
